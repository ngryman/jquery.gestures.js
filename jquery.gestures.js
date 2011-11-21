/*
 * jquery.gestures.js version 0.1
 *
 * Support of gestures (touch & mouse) for any element.
 *
 */

(function($) {
  var touchSupported = ('ontouchstart' in window);
  var startEvent = touchSupported ? 'touchstart' : 'mousedown';
  var moveEvent  = touchSupported ? 'touchmove'  : 'mousemove';
  var endEvent = touchSupported ? 'touchend' : 'mouseup mouseout';
  var gestures = ['swipe'];
  var NS = 'gestures' + Math.ceil(Math.random() * Math.pow(10, 10));
  var updateGestures = {};


  function getCoordinates(event) {
    return  {
      x: touchSupported ?
        event.originalEvent.touches[0].pageX :
        event.clientX + (document.body.scrollLeft || document.documentElement.scrollLeft),
      y: touchSupported ?
        event.originalEvent.touches[0].pageY :
        event.pageY + (document.body.scrollTop  || document.documentElement.scrollTop)
    };
  }


  function createEvent(event, data) {
    if (!data) data = {};
    data.originalEvent = event;
    return data;
  }


  function createData(el, gestureName) {
    var opts = el[NS],
      gestureOpts = el[NS].gestures[gestureName];

    // first move, stores old coordinates
    if (gestureOpts.data === undefined) {
      gestureOpts.data = {};
      gestureOpts.data.x = opts.x;
      gestureOpts.data.y = opts.y;
    }

    return gestureOpts.data;
  }


	function createGesture(el, gestureName) {
		if (el[NS].gestures === undefined)
			el[NS].gestures = {};

		var gestureOpts = el[NS].gestures;

		if (gestureOpts[gestureName] === undefined) {
			gestureOpts[gestureName] = {
			name:   gestureName,
      update: $.Callbacks(),
      end:    $.Callbacks()
			};
		}

		return gestureOpts[gestureName];
	}


  function onMove(event) {
    var el = this,
      opts = el[NS];

    // if not moving, discard it
    if (!opts.isMoving) return;

    $.each(opts.gestures, function() {
      var customEvent = updateGestures[this.name].call(el, event, getCoordinates(event));
			this.update.fireWith(el, [customEvent])
    });
  }


  function onEnd(event) {
    var el = this,
      opts = el[NS], e;

    // stop move, reset for next event
    delete opts.isMoving;
    delete opts.x;
    delete opts.y;

    // unregisters on the fly events
    $(this).unbind(moveEvent).unbind(endEvent);

    $.each(opts.gestures, function() {
      e = createEvent(event, this.data);
      delete this.data;
			this.end.fireWith(el, [e]);
    });
  }


  function registerCallbacks(el, gestureName, updateCallback, endCallback) {
    var $el = $(el);

    if (!$el.prop(NS))
      $el.prop(NS, {});

    var opts = $el.prop(NS);

    // stores callbacks
		var gestures = createGesture(el, gestureName);
		if (typeof updateCallback == 'function') gestures.update.add(updateCallback);
		if (typeof endCallback    == 'function') gestures.end.add(endCallback);

    // if start is already registered, skip this
    if (opts.x && opts.y) return;

    $el.bind(startEvent, function(event) {
      var $this = $(this);
      var opts =  $this.prop(NS);

      // is moving
      opts.isMoving = true;

      // remembers start coordinates
      $.extend(opts, getCoordinates(event));

      // call gesture update function and, if defined, user <xxx>change event callback
      $this.bind(moveEvent, onMove);
      // end gesture
      $this.bind(endEvent, onEnd);
    });
  }


  /*$.fn.gestures = function(options) {
    var opts = {
      cancelOnMove: true,
      onlyIf: function() { return true },
      touchDelay: 0,
      callback: undefined
    };

    switch(typeof options) {
      case 'function':
        opts.callback = options;
        break;

      case 'object':
        $.extend(opts, options);
        break;
    }

    return this;
  };*/


  /*
   * swipe gesture
   */

  updateGestures.swipe = function(event, coordinates) {
    var e = createEvent(event),
      data = createData(this, 'swipe');

    // computes deltas
    var dX = coordinates.x - data.x;
    var dY = coordinates.y - data.y;

    // first move, detection which direction
    if (!data.direction)
      data.direction = Math.abs(dX) > Math.abs(dY) ? 'horizontal' : 'vertical';

    // sets direction and selects the right delta
    e.direction = data.direction;
    e.delta = data.direction == 'horizontal' ? dX : dY;

    // accumulates deltas
    if (!data.delta)
      data.delta = 0;
    data.delta += e.delta;

    // stores old coordinates
    data.x = coordinates.x;
    data.y = coordinates.y;

    return e;
  };


  $.fn.swipechange = function(callback) {
    this.each(function() {
      registerCallbacks(this, 'swipe', callback);
    });
    return this;
  };


  $.fn.swipeend = function(callback) {
    this.each(function() {
      registerCallbacks(this, 'swipe', null, callback);
    });
    return this;
  };

})(jQuery);