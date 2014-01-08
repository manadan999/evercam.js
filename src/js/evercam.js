(function(window, $) {

  "use strict";

  window.Evercam = {

    apiUrl: 'https://api.evercam.io/v1',
    proxyUrl: 'http://ec2-54-194-83-178.eu-west-1.compute.amazonaws.com:3030/',

    setApiUrl: function(url) {
      this.apiUrl = url;
    },

    Model: {
      url: function(ext){
        if (typeof(ext) === 'undefined') ext = '';
        else ext = '/' + ext;
        return window.Evercam.apiUrl + '/models' + ext;
      },

      all: function(callback) {
        $.getJSON(this.url(), function(data) {
          callback(data.vendors);
        });
      },

      by_vendor: function (vid, callback) {
        $.getJSON(this.url(vid), function(data) {
          callback(data.vendors[0]);
        });
      },

      by_model: function (vid, mid, callback) {
        $.getJSON(this.url(vid + '/' + mid), function(data) {
          callback(data.models[0]);
        });
      }
    },

    User: {
      url: function(ext){
        if (typeof(ext) === 'undefined') ext = '';
        else ext = '/' + ext;
        return window.Evercam.apiUrl + '/users' + ext;
      },

      create: function (params, callback) {
        $.post(this.url(), params, function(data) {
          callback(data.users[0]);
        });
      },

      streams: function (uid, callback) {
        $.getJSON(this.url(uid + '/streams'), function(data) {
          callback(data.streams);
        });
      }
    },

    Vendor: {
      url: function(ext){
        if (typeof(ext) === 'undefined') ext = '';
        else ext = '/' + ext;
        return window.Evercam.apiUrl + '/vendors' + ext;
      },

      all: function (callback) {
        $.getJSON(this.url(), function(data) {
          callback(data.vendors);
        });
      },

      by_mac: function (mac, callback) {
        $.getJSON(this.url(mac), function(data) {
          callback(data.vendors);
        });
      }
    },

    Stream: function (name) {
      this.data = null;
      this.timestamp = 0;
      this.endpoint = null;
      this.name = name;
      this.useProxy = true;
    }

  };

  // STREAM PLUGIN DEFINITION
  // =======================

  Evercam.Stream.url = function (ext) {
    if (typeof(ext) === 'undefined') ext = '';
    else ext = '/' + ext;
    return window.Evercam.apiUrl + '/streams' + ext;
  };

  Evercam.Stream.by_id = function (id, callback) {
    $.getJSON(this.url(id), function (data) {
      callback(data.streams[0]);
    });
  };

  Evercam.Stream.create = function (params, callback) {
    $.post(this.url(), params, function (data) {
      callback(data.streams[0]);
    });
  }

  Evercam.Stream.prototype.selectEndpoint = function () {
    var self = this;
    testCROS(this.data.endpoints[0] + this.data.snapshots.jpg, function(available) {
      self.endpoint = self.data.endpoints[0];
      if (available) {
        self.useProxy = false;
      }
      self.onUp();
    });
  };

  Evercam.Stream.prototype.fetchSnapshotData = function () {
    var self = this;
    Evercam.Stream.by_id(this.name, function(stream) {
      self.data = stream;
      self.selectEndpoint();
    })
  };

  function testCROS(url, callback) {
    if (!$.support.cors) return false;

    $.ajax({
      url: url,
      timeout: 2000,
      xhrFields: {
        withCredentials: true
      },

      success: function() {
        callback(true);
      },

      error: function() {
        callback(false);
      }
    });

  };

  function base64Encode(str) {
    var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var out = "", i = 0, len = str.length, c1, c2, c3;
    while (i < len) {
        c1 = str.charCodeAt(i++) & 0xff;
        if (i == len) {
            out += CHARS.charAt(c1 >> 2);
            out += CHARS.charAt((c1 & 0x3) << 4);
            out += "==";
            break;
        }
        c2 = str.charCodeAt(i++);
        if (i == len) {
            out += CHARS.charAt(c1 >> 2);
            out += CHARS.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
            out += CHARS.charAt((c2 & 0xF) << 2);
            out += "=";
            break;
        }
        c3 = str.charCodeAt(i++);
        out += CHARS.charAt(c1 >> 2);
        out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
        out += CHARS.charAt(c3 & 0x3F);
    }
    return out;
  }

  Evercam.Stream.prototype.isUp = function (callback) {
    this.onUp = callback;
  };

  Evercam.Stream.prototype.needsAuth = function (callback) {
    this.onAuth = callback;
  };

  Evercam.Stream.prototype.run = function () {
    this.fetchSnapshotData();
  }

  Evercam.Stream.prototype.imgUrl = function () {
    var uri = '';
    this.timestamp = new Date().getTime();
    if (this.useProxy) {
      uri = Evercam.proxyUrl + 'snapshot?url=' +  this.endpoint + this.data.snapshots.jpg + '?' +
        this.timestamp + '&auth=' + base64Encode(this.data.auth.basic.username + ":" + this.data.auth.basic.password);
    } else {
      uri = this.endpoint + this.data.snapshots.jpg;
    }
    return uri;
  };

  // EVERCAM PLUGIN DEFINITION
  // =======================

  $.fn.evercam = function(type, opts) {

    // override defaults
    var settings = $.extend({
      refresh: 0
    }, opts);

    var $img = $(this);
    var stream = new Evercam.Stream(settings.name);
    var watcher = null;

    var updateImage = function() {
      watcher = setTimeout(updateImage, 5000);
      $img.attr('src', stream.imgUrl());
    }

    // check img auto refresh
    $img.on('load', function() {

      clearTimeout(watcher);

      if(settings.refresh > 0) {
        var loading = new Date().getTime() - stream.timestamp;
        var delay = settings.refresh - loading;
        watcher = setTimeout(updateImage, delay);
      }

    }).on('abort', function() {
      console.log('abort');
      clearTimeout(watcher);
    });

    stream.isUp(function() {
      updateImage();
    });

    stream.needsAuth(function() {
      console.log(stream.name + ' requires authorization to view');
    });

    stream.run();
    return this;

  };

  $(window).load(function() {
    $.each($('img[evercam]'), function(i, e) {
      var $img = $(e);

      var name = $img.attr('evercam');
      var refresh = Number($img.attr('refresh'));

      // ensure number
      if(NaN == refresh) {
        refresh = 0;
      }

      $img.evercam('snapshot', {
        name: name,
        refresh: refresh
      });
    });
  });

})(window, jQuery);
