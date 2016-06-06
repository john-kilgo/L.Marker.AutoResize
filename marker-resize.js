/* L.Marker.AutoResize plugin */

/* The MIT License (MIT)

Copyright (c) 2016 The MITRE Corporation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */

/* The Auto adjusting marker */
L.Marker.AutoResize = L.Marker.extend({

	options: {
		iconArray: [],
		icon: null
	},

	// Override initialize
	initialize: function (latlng, options) {
		L.setOptions(this, options);

		var options = this.options;

		// Did the user supply 3 icons?
		if (options.iconArray.length !== 3) {
			console.log("WARNING :: 3 icons not defined in L.Marker.AutoResize, an ineffient Marker will be produced.")
			if (options.iconArray[0] instanceof L.Icon) {
				options.iconArray[1] = options.iconArray[0];
				options.iconArray[2] = options.iconArray[0];
			} else {
				options.iconArray = [new L.Icon.Default(),
					 	     		 new L.Icon.Default(),
						     		 new L.Icon.Default()];
			}
		}

		// Set the default icon, mid-range zoom level
		// Used by _initIcon override
		// A value between 0 and 2 (since three icons are allowed to be zoomed)
		this._initIconParam = 1;

		this._latlng = L.latLng(latlng);
	},

	// Override update 
	update: function () {

		if (this._icon) {
			this._updateZoomend();

			var pos = this._map.latLngToLayerPoint(this._latlng).round();
			this._setPos(pos);

		}

		return this;
	},

	// Gets the current zoom from the map and applies appropriate icon
	_updateZoomend: function() {

		var map = this._map,
		    zoom = map.getZoom(),
		    min = isFinite(map.getMinZoom()) ? map.getMinZoom() : 2,
		    max = isFinite(map.getMaxZoom()) ? map.getMaxZoom() :20,
		    zoomed, outer;

		zoomed = Math.ceil((max - min) * (2/3) + min);
		outer  = Math.ceil((max - min) * (1/3) + min);

		/*
		console.log("in _updateZoomend")
		console.log("	zoom: " + zoom)
		console.log("	min: " + min)
		console.log("	max: " + max)
		console.log("	zoomed: " + zoomed)
		console.log("	outer: " + outer)
		*/

		if (zoom >= zoomed) {
			this._initIconParam = 2;
			this._initIcon(); 
		}
		else if (zoom < zoomed && zoom > outer) {
			this._initIconParam = 1;
			this._initIcon();
		}
		else if (zoom <= outer) {
			this._initIconParam = 0;
			this._initIcon();
		}
	},

	// Override _initIcon()
	_initIcon: function () {

		// objects used by internal functions: this._shadow, this._icon
		// _initIconCurrent = current icon actually on the map
		// _initIconParam = icon that is requested
		// _iconArrayInitialized = ensures that the intialization is only performed once

		// TODO:
		// 1. Override setIcon(), set this._icon to null to trigger new creation of icon?????

		var options = this.options
		var classToAdd = 'leaflet-zoom-' + (this._zoomAnimated ? 'animated' : 'hide');

		if(!this._iconArrayInitialized) {

			// init to be able to use
			this._iconArray = [];
			this._shadowArray = [];

			// Create the icons and shadows
			for (var i = 0; i < 3; i++) {
				this._iconArray[i] = options.iconArray[i].createIcon();
				this._shadowArray[i] = options.iconArray[i].createShadow();

				// Give icons title/alt text if options call for them
				if (options.title) {
					this._iconArray[i].title = options.title;
				}
				if (options.alt) {
					this._iconArray[i].alt = options.alt;
				}
				if (options.keyboard) {
					this._iconArray[i].tabIndex = '0';
				}

			}

			if (options.riseOnHover) {
				this.on({
					mouseover: this._bringToFront,
					mouseout: this._resetZIndex
				});
			}

			// Keep track of current icon
			// Set to a number different from this._initIconParam to trigger creation of icon
			this._initIconCurrent = 0;
			this._iconArrayInitialized = true;

		}

		// Where the icons are actually changed
		// We want it to continue to the second part after initialilzation

		// Different icon requested from existing icon
		if (this._initIconCurrent !== this._initIconParam) {
			// No icon exists
			if (!this._icon) {

				this._icon = this._iconArray[this._initIconParam];

				L.DomUtil.addClass(this._icon, classToAdd);

				if (options.riseOnHover) {
					this.on({
						mouseover: this._bringToFront,
						mouseout: this._resetZIndex
					});
				}

				// Shadows
				if (this._shadowArray[this._initIconParam]) {
					this._shadow = this._shadowArray[this._initIconParam];
					L.DomUtil.addClass(this._shadow, classToAdd);
					this.getPane('shadowPane').appendChild(this._shadow);
				}

				if (options.opacity < 1) {
					this._updateOpacity();
				}

				this.getPane().appendChild(this._icon);
				this._initInteraction();


			} else { // Icon exists

				// replace icons 
				this._removeIcon();
				// remove existing shadow if it exists
				if (this._shadowArray[this._initIconCurrent])
					this._removeShadow();

				this._initIconCurrent = this._initIconParam;

				this._icon = this._iconArray[this._initIconParam];
				L.DomUtil.addClass(this._icon, classToAdd);

				if (options.riseOnHover) {
					this.on({
						mouseover: this._bringToFront,
						mouseout: this._resetZIndex
					});
				}

				// Shadows
				if (this._shadowArray[this._initIconParam]) {
					this._shadow = this._shadowArray[this._initIconParam];
					L.DomUtil.addClass(this._shadow, classToAdd);
					this.getPane('shadowPane').appendChild(this._shadow);
				}

				if (options.opacity < 1) {
					this._updateOpacity();
				}

				this.getPane().appendChild(this._icon);
				this._initInteraction();

			}

		} else { // Same icon requested, let's exit
			return;
		}
	}

});

L.autoResizeMarker = function(latlng, options) {
	return new L.Marker.AutoResize(latlng, options);
};
