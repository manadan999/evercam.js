(function(window, $) {

  "use strict";

  window.Evercam = {

    apiUrl: 'https://api.evercam.io/v1',

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
    }

  };

})(window, jQuery);
