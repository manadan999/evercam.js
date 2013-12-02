describe("Evercam", function() {

  var subject = Evercam;

  describe("#apiUrl", function() {

    it("defaults to the evercam api via https", function() {
      expect(subject.apiUrl).toBe('https://api.evercam.io/v1');
    });

    it("can be overridden to another url", function() {
      subject.setApiUrl('http://localhost');
      expect(subject.apiUrl).toBe('http://localhost');
    });

  });

});

