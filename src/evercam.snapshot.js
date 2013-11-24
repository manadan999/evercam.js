window.Evercam = window.Evercam || {

  apiUrl: 'https://api.evercam.io/v1',

  setApiUrl: function(url) {
    this.apiUrl = url;
  }

};

Evercam.Snapshot = function(name) {

  var _name = name;
  var _isUp = null, _needsAuth = null;
  this.timestamp = 0;

  var fetchSnapshotData = function() {
    var snapshotsUrl = Evercam.apiUrl +
      '/streams/' + _name + '/snapshots';

    jQuery.ajax({
      url: snapshotsUrl,
      async: false,
      xhrFields: {
        withCredentials: true
      },
      statusCode: {
        200: function(resp) {
          _isUp = true;
          _data = resp;
        },
        401: function(resp) {
          _needsAuth = true;
        },
        404: function(resp) {
          _isUp = false;
        }
      }
    });
  };

  this.isUp = function() {
    if(null == _isUp) {
      fetchSnapshotData();
    }

    return _isUp;
  };

  this.imgUrl = function() {
    if(null == _data) {
      return '#';
    }

    this.timestamp = new Date().getTime();
    var uri = _data.uris.external + '/' +
      _data.formats.jpg.path + '?' +
      this.timestamp;

    return uri;
  };

};

