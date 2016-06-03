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

/* Auto adjusting marker */
L.Marker.AutoResize = L.Marker.extend({

	options: {
		iconArray: [],
		icon: null
	},


	initialize: function (latlng, options) {
		L.setOptions(this, options);

		var options = this.options;

		// Did the user supply 3 icons? If not, let's help them out
		if (options.iconArray.length !== 3) {
			if (options.iconArray[0] instanceof L.Icon) {
				options.iconArray[1] = options.iconArray[0];
				options.iconArray[2] = options.iconArray[1];
			} else {
				options.iconArray = [new L.Icon.Default(),
									 new L.Icon.Default(),
									 new L.Icon.Default()];
			}
		}

		// Set the default icon, mid-range zoom level
		options.icon = options.iconArray[2];

		this._latlng = L.latLng(latlng);
	},

	update: function () {

		if (this._icon) {

			var pos = this._map.latLngToLayerPoint(this._latlng).round();
			this._setPos(pos);

			this._updateZoomend(); /* Perform update of icon depending upon zoom status. */
		}

		return this;
	},


	_updateZoomend: function() {

		var map = this._map,
			icons = this.options.iconArray,
			zoom = map.getZoom(),
			min = map.getMinZoom() || 2,
			max = map.getMaxZoom() || 20,
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
			if (this.options.icon === icons[2]) {
				return;
			}
			else {
				this.options.icon = icons[2];
				this._initIcon(); 
			}

		} else if (zoom < zoomed && zoom > outer) {
			if (this.options.icon === icons[1]) {
				return;
			}
			else {
				this.options.icon = icons[1];
				this._initIcon();
			}
	
		} else if (zoom <= outer) {
			if (this.options.icon === icons[0]) {
				return;
			}
			else {
				this.options.icon = icons[0];
				this._initIcon();
			}
	
		}
	},


});

L.autoResizeMarker = function(latlng, options) {
	return new L.Marker.AutoResize(latlng, options);
};