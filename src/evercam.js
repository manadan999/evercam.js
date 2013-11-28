(function($) {

  $.fn.evercam = function(type, opts) {

    // override defaults
    var settings = $.extend({
      refresh: 0
    }, opts);

    var $img = $(this);
    var snapshot = new Evercam.Snapshot(settings.name);

    var updateImage = function() {
      $img.attr('src', snapshot.imgUrl());
    }

    // check img auto refresh
    $img.on('load', function() {
      if(settings.refresh > 0) {
        var loading = new Date().getTime() - snapshot.timestamp;
        var delay = settings.refresh - loading;
        setTimeout(updateImage, delay);
      }
    }).on('error', updateImage).on('abort', function() {
      alert('abort');
    });

    // only if alive
    if(snapshot.isUp()) {
      updateImage();
    } else if(snapshot.needsAuth()) {
      alert(snapshot.name + ' requires authorization to view');
    }

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

}(jQuery));

