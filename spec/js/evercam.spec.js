describe("Evercam", function() {

  $( document ).ajaxError(function( event, request, settings ) {
    console.log( "Error requesting page " + settings.url );
  });

  var subject = Evercam;

  describe("#apiUrl", function() {

    it("defaults to the evercam api via https", function() {
      expect(subject.apiUrl).toBe('https://api.evercam.io/v1');
    });

    it("can be overridden to another url", function() {
      subject.setApiUrl('http://localhost:3000/v1');
      expect(subject.apiUrl).toBe('http://localhost:3000/v1');
    });

  });

  describe("Models", function() {

    it("get all", function(done) {
      subject.Model.all(function(vendors) {
        expect(vendors.length).toBe(2);
        done();
      });
    });

    it("get by vendor", function(done) {
      subject.Model.by_vendor('testid', function(vendor) {
        expect(vendor.id).toBe('testid');
        done();
      });
    });

    it("get by model", function(done) {
      subject.Model.by_model('testid', 'YCW005', function(model) {
        expect(model.vendor).toBe('testid');
        expect(model.name).toBe('YCW005');
        done();
      });
    });

  });

});

