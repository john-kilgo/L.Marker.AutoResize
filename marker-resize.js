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
		// Used by _initIcon override
		// A value between 0 and 2 (since three icons are allowed to be zoomed)
		this._initIconParam = 1;

		this._latlng = L.latLng(latlng);
	},

	update: function () {

		if (this._icon) {
			this._updateZoomend();

			var pos = this._map.latLngToLayerPoint(this._latlng).round();
			this._setPos(pos);

		}

		return this;
	},


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

/*
		if (zoom >= zoomed) {
			if (this.options.icon === this.options.iconArray[2]) {
				return;
			} else {
				this.options.icon = this.options.iconArray[2];
				this._initIcon(); 
			}

		} else if (zoom < zoomed && zoom > outer) {
			if (this.options.icon === this.options.iconArray[1]) {
				return;
			} else {
				this.options.icon = this.options.iconArray[1];
				this._initIcon();
			}
	
		} else if (zoom <= outer) {
			if (this.options.icon === this.options.iconArray[0]) {
				return;
			} else {
				this.options.icon = this.options.iconArray[0];
				this._initIcon();
			}
		} */
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


				//console.log(":: In _initIcon making some icons: " + i + " " + this._iconArray[i]) // DEBUG
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
			//console.log("So, we're in the initial sections of _initIcon() " + this._iconArrayInitialized)
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
					console.log("shadow exists")
					this._shadow = this._shadowArray[this._initIconParam];
					L.DomUtil.addClass(this._shadow, classToAdd);
					this.getPane('shadowPane').appendChild(this._shadow);
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
					console.log("shadow exists")
					this._shadow = this._shadowArray[this._initIconParam];
					L.DomUtil.addClass(this._shadow, classToAdd);
					this.getPane('shadowPane').appendChild(this._shadow);
				}

				this.getPane().appendChild(this._icon);
				this._initInteraction();

			}

		} else { // Same icon requested, let's exit
			return;
		}

		    
/*
		var icon = options.icon.createIcon(this._icon),
		    addIcon = false;

		// if we're not reusing the icon, remove the old one and init new one
		if (icon !== this._icon) {
			if (this._icon) {
				this._removeIcon();
			}
			addIcon = true;

			if (options.title) {
				icon.title = options.title;
			}
			if (options.alt) {
				icon.alt = options.alt;
			}
		}

		L.DomUtil.addClass(icon, classToAdd);

		if (options.keyboard) {
			icon.tabIndex = '0';
		}

		this._icon = icon;

		if (options.riseOnHover) {
			this.on({
				mouseover: this._bringToFront,
				mouseout: this._resetZIndex
			});
		}

		var newShadow = options.icon.createShadow(this._shadow),
		    addShadow = false; */

		/*if (newShadow !== this._shadow) {
			this._removeShadow();
			addShadow = true;
		}

		if (newShadow) {
			L.DomUtil.addClass(newShadow, classToAdd);
		}
		this._shadow = newShadow; */

/*
		if (options.opacity < 1) {
			this._updateOpacity();
		}


		if (addIcon) {
			this.getPane().appendChild(this._icon);
		}
		this._initInteraction();
		if (newShadow && addShadow) {
			this.getPane('shadowPane').appendChild(this._shadow);
		} */
	},

/*	_initIcon: function () {

		// Todos:
		// Two components:
		// Init the icons by calling create icon (three icons)
		// put internal check in place (boolean), when they are already created, to perform the Dom manipulations
		// don't forget you need to do it twice: for the icons and the shadows AND also the init and remove interactions
		var options = this.options,
		    classToAdd = 'leaflet-zoom-' + (this._zoomAnimated ? 'animated' : 'hide');

		// icon.createIcon(this._icon)
		// if (this._icon) doesn't exist, new image tag is made, otherwise existing tag's source is changed
		// then icon._setIconStyles is called
		// result is object like this: <img src="example-marker.png" class="leaflet-marker-icon " style="margin-left: -48px; margin-top: -96px; width: 96px; height: 96px;">
		var icon = options.icon.createIcon(this._icon),
		    addIcon = false;

		// this._icon stores this object ^

		// if we're not reusing the icon, remove the old one and init new one
		if (icon !== this._icon) {
			if (this._icon) {
				this._removeIcon();
				// ^ this calls L.DomUtil.remove(this._icon)
				// DomUtil.remove finds object node in Dom and removes object from page: could hide instead?
			}
			addIcon = true;
			// ^ Icons are different, appendChild() need to be called to add to pane
			// this.getPane().appendChild(this._icon);

			if (options.title) {
				icon.title = options.title;
			}
			if (options.alt) {
				icon.alt = options.alt;
			}
		}

		// Adds classToAdd to the icon element
		L.DomUtil.addClass(icon, classToAdd);

		if (options.keyboard) {
			icon.tabIndex = '0';
		}

		this._icon = icon;

		if (options.riseOnHover) {
			this.on({
				mouseover: this._bringToFront,
				mouseout: this._resetZIndex
			});
		}

		// createShawdow simply calls _createIcon(this._shadow), since a shadow is another image
		var newShadow = options.icon.createShadow(this._shadow),
		    addShadow = false;

		if (newShadow !== this._shadow) {
			this._removeShadow();
			addShadow = true;
		}

		if (newShadow) {
			L.DomUtil.addClass(newShadow, classToAdd);
		}
		this._shadow = newShadow;


		if (options.opacity < 1) {
			this._updateOpacity();
		}


		if (addIcon) {
			this.getPane().appendChild(this._icon);
		}
		this._initInteraction();
		if (newShadow && addShadow) {
			this.getPane('shadowPane').appendChild(this._shadow);
		}
	},
*/

});

L.autoResizeMarker = function(latlng, options) {
	return new L.Marker.AutoResize(latlng, options);
};

