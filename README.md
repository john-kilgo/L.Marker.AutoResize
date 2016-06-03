# L.Marker.AutoResize

Leaflet plugin that resizes marker icons based on zoom level.

The difference between the maximum and minimum zoom level allowed on your map is broken up into three relatively equal parts: The top third of the zoom level ("zoomed in"), a mid-range, and an outer range ("zoomed out").

## How to use

[View a demo](http://john-kilgo.github.io/L.Marker.AutoResize)


Include after Leaflet:
```
<script src="../marker-resize.js"></script>
```

Create some custom icons:
```
var iconSmaller = L.icon({
	iconUrl: 'example-marker.png',
	iconSize: [30, 30]
});

var iconMedium = L.icon({
	iconUrl: 'example-marker.png',
	iconSize: [50, 50]
});

var iconLarge = L.icon({
	iconUrl: 'example-marker.png',
	iconSize: [80, 80]
});

```

Create a marker using these icons (required parameter is iconArray, an array of exactly three icons):
```
L.autoResizeMarker([42.5, -71.239], {iconArray: [iconSmaller, iconMedium, iconLarge]}).addTo(mymap);
```
In this example, the smallest icon is shown when zoomed out, the medium icon when in the mid-range of the zoom, and the largest icon when zoomed in to the map. Reversing the order would have the smallest icon shown when the map is zoomed in and the large icon shown when zoomed out, in this example.


