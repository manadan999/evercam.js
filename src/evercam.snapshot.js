window.Evercam = window.Evercam || {

  apiUrl: 'https://api.evercam.io/v1',

  setApiUrl: function(url) {
    this.apiUrl = url;
  }

};

Evercam.Snapshot = function(name) {

  this.up = null;
  this.auth = null;
  this.data = null;
  this.timestamp = 0;
  this.name = name;

};

Evercam.Snapshot.prototype.fetchSnapshotData = function() {
  var snapshotsUrl = Evercam.apiUrl +
    '/streams/' + this.name + '/snapshots';

  this.up = false;
  this.auth = false;
  var self = this;

  jQuery.ajax({
    url: snapshotsUrl,
    async: false,
    xhrFields: {
      withCredentials: true
    },
    statusCode: {
      200: function(resp) {
        self.up = true;
        self.data = resp;
      },
      401: function(resp) {
        self.auth = true;
      },
      404: function(resp) {
        self.up = false;
      }
    }
  });
};

Evercam.Snapshot.prototype.isUp = function() {
  if(null == this.up) {
    this.fetchSnapshotData();
  }

  return this.up;
};

Evercam.Snapshot.prototype.needsAuth = function() {
  if(null == this.auth) {
    this.fetchSnapshotData();
  }

  return this.auth;
};

Evercam.Snapshot.prototype.imgUrl = function() {
  if(null == this.data) {
    return '#';
  }

  this.timestamp = new Date().getTime();
  var uri = this.data.uris.external + '/' +
    this.data.formats.jpg.path + '?' +
    this.timestamp;

  return uri;
};

