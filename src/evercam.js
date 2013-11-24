(function($) {

  $.fn.evercam = function(type, opts) {

    // override defaults
    var settings = $.extend({
      refresh: 0
    }, opts);

    var $img = $(this);
    var snapshot = new Evercam.Snapshot(settings.name);

    $img.on('load error', function() {
      if(settings.refresh > 0) {
        var now = new Date().getTime();
        var previous = now - snapshot.timestamp;
        var delay = settings.refresh - previous;
        setTimeout(updateImage, delay);
      }
    });

    var updateImage = function() {
      $img.attr('src', snapshot.imgUrl());
    }

    if(snapshot.isUp()) {
      updateImage();
    }

    return this;

  };

  $(window).load(function() {
    $.each($('img[evercam]'), function(i, e) {
      var $img = $(e);
      var name = $img.attr('evercam');
      var rate = Number($img.attr('refresh'));

      if(NaN == rate) {
        rate = 0;
      }

      $img.evercam('snapshot', {
        name: name,
        refresh: rate
      });
    });
  });

}(jQuery));

