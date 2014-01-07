(function(window, $) {

  "use strict";

  window.Evercam = {

    apiUrl: 'https://api.evercam.io/v1',
    proxyUrl: 'http://localhost:3030/',

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

    Stream: {
      url: function(ext){
        if (typeof(ext) === 'undefined') ext = '';
        else ext = '/' + ext;
        return window.Evercam.apiUrl + '/streams' + ext;
      },

      create: function(params, callback) {
        $.post(this.url(), params, function(data) {
          callback(data.streams[0]);
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

    Snapshot: function (name) {
      this.data = null;
      this.timestamp = 0;
      this.name = name;
    }

  };

  Evercam.Snapshot.prototype.url = function (stream, ext) {
    if (typeof(ext) === 'undefined') ext = '';
    else ext = '/' + ext;
    return window.Evercam.Stream.url(stream) + '/snapshots' + ext;
  };

  // Can't use 'new'
  Evercam.Snapshot.prototype.create = function (stream, callback) {
    $.getJSON(this.url(stream, 'new'), function (data) {
      callback(data);
    });
  };

  Evercam.Snapshot.prototype.fetchSnapshotData = function () {
    var snapshotsUrl = Evercam.apiUrl +
      '/streams/' + this.name + '/snapshots/new';

    var self = this;

    jQuery.ajax({
      url: snapshotsUrl,
      xhrFields: {
        withCredentials: true
      },
      statusCode: {
        200: function (resp) {
          self.up = true;
          self.data = resp;
          self.onUp();
        },
        401: function (resp) {
          self.up = true;
          self.onAuth();
        },
        404: function (resp) {
          self.up = false;
        }
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

  Evercam.Snapshot.prototype.isUp = function (callback) {
    this.onUp = callback;
  };

  Evercam.Snapshot.prototype.needsAuth = function (callback) {
    this.onAuth = callback;
  };

  Evercam.Snapshot.prototype.run = function () {
    this.fetchSnapshotData();
  }

  Evercam.Snapshot.prototype.imgUrl = function () {
    if (this.up) {
      this.timestamp = new Date().getTime();
      var uri = Evercam.proxyUrl + 'snapshot?url=' +  this.data.uris.external +
        this.data.formats.jpg.path + '?' +
        this.timestamp + '&auth=' + base64Encode(this.data.auth.basic.username + ":" + this.data.auth.basic.password);

      return uri;
    }
  };

  $.fn.evercam = function(type, opts) {

    // override defaults
    var settings = $.extend({
      refresh: 0
    }, opts);

    var $img = $(this);
    var snapshot = new Evercam.Snapshot(settings.name);
    var watcher = null;

    var updateImage = function() {
      watcher = setTimeout(updateImage, 5000);
      $img.attr('src', snapshot.imgUrl());
    }

    // check img auto refresh
    $img.on('load', function() {

      clearTimeout(watcher);

      if(settings.refresh > 0) {
        var loading = new Date().getTime() - snapshot.timestamp;
        var delay = settings.refresh - loading;
        setTimeout(updateImage, delay);
      }

    }).on('abort', function() {
      console.log('abort');
    });

    snapshot.isUp(function() {
      updateImage();
    });

    snapshot.needsAuth(function() {
      console.log(snapshot.name + ' requires authorization to view');
    });

    snapshot.run();
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
