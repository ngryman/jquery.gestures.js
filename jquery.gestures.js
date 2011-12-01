/*
 * jquery.gestures.js version 0.1
 *
 * Support of gestures (touch & mouse) for any element.
 *
 * @todo: enable per gesture configurable threshold
 */

(function($) {
	var touchSupported = ('ontouchstart' in window);
	var startEvent = touchSupported ? 'touchstart' : 'mousedown';
	var moveEvent = touchSupported ? 'touchmove' : 'mousemove';
	var endEvent = touchSupported ? 'touchend' : 'mouseup mouseleave';
	var gestures = ['swipe'];
	var NS = 'gestures' + Math.ceil(Math.random() * Math.pow(10, 10));
	var updateGestures = {};
	var threshold = 10;


	function getCoordinates(event) {
		return	{
			x: touchSupported ?
				event.originalEvent.touches[0].pageX :
				event.clientX + (document.body.scrollLeft || document.documentElement.scrollLeft),
			y: touchSupported ?
				event.originalEvent.touches[0].pageY :
				event.pageY + (document.body.scrollTop || document.documentElement.scrollTop)
		};
	}


	function createEvent(event, data) {
		var e = {};
		
		if (data)
			for(var p in data)
				e[p] = data[p];
		
		e.originalEvent = event;
		return e;
	}


	function createData(el, gestureName) {
		var opts = el[NS],
			gestureOpts = el[NS].gestures[gestureName];

		// first move, stores old coordinates
		if (gestureOpts.data === undefined) {
			gestureOpts.data = {
				x: opts.x,
				y: opts.y,
				startX: opts.x,
				startY: opts.y
			};
		}

		return gestureOpts.data;
	}


	function createGesture(el, gestureName) {
		if (el[NS].gestures === undefined)
			el[NS].gestures = {};

		var gestureOpts = el[NS].gestures;

		if (gestureOpts[gestureName] === undefined) {
			gestureOpts[gestureName] = {
				name:	 gestureName,
				update: $.Callbacks(),
				end:		$.Callbacks()
			};
		}

		return gestureOpts[gestureName];
	}


	function onMove(event) {
		var el = this,
			opts = el[NS];

		// if not pressed, discard it
		if (!opts.isPressed) return;

		// gets coordinates
		var coordinates = getCoordinates(event);
		
		// computes deltas
		opts.dX = coordinates.x - opts.x;
		opts.dY = coordinates.y - opts.y;

		// if threshold is reached, we are moving and gestures are activated
		if (Math.abs(opts.dX) >= threshold || Math.abs(opts.dY) >= threshold) {
			opts.isMoving = true;

			$.each(opts.gestures, function() {
				var customEvent = updateGestures[this.name].call(el, event, coordinates);
				this.update.fireWith(el, [customEvent])
			});
		}
	}


	function onEnd(event) {
		var el = this,
			opts = el[NS],
			isMoving = opts.isMoving, e;

		// reset for next event
		delete opts.isPressed;
		delete opts.isMoving;
		delete opts.x;
		delete opts.y;

		// unregisters on the fly events
		$(this).unbind(moveEvent, onMove).unbind(endEvent, onEnd);

		// only triggers end callbacks if moved
		if (isMoving) {
			$.each(opts.gestures, function() {
				e = createEvent(event, this.data);
				delete this.data;
				this.end.fireWith(el, [e]);
			});
		}
	}


	function registerCallbacks(el, gestureName, updateCallback, endCallback) {
		var $el = $(el);

		if (!$el.prop(NS))
			$el.prop(NS, {});

		var opts = $el.prop(NS);

		// stores callbacks
		var gestures = createGesture(el, gestureName);
		if (typeof updateCallback == 'function') gestures.update.add(updateCallback);
		if (typeof endCallback == 'function') gestures.end.add(endCallback);

		// if start is already registered, skip this
		if (opts.x && opts.y) return;

		$el.bind(startEvent, function(event) {
			var $this = $(this);
			var opts = $this.prop(NS);

			// is pressed
			opts.isPressed = true;

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
	 * @todo: use opts.dX, opts.dY to get total delta of event
	 */

	updateGestures.swipe = function(event, coordinates) {
		var data = createData(this, 'swipe'),
			e = createEvent(event, data);

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