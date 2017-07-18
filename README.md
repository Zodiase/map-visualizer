# Map Visualizer

[![Greenkeeper badge](https://badges.greenkeeper.io/Zodiase/map-visualizer.svg)](https://greenkeeper.io/)

Implemented with [OpenLayers 3](http://openlayers.org/), the Map Visualizer can load a flat list of layers and let the user configure each layer and share the visual results with other users.

Visit the app at: [zodiase.github.io/map-visualizer](http://zodiase.github.io/map-visualizer/)

## Get Started
- Pass in a link to a layers source file: http://zodiase.github.io/map-visualizer/#source=sample-source/tiled-arcgis.json
- Start playing with the layers!

## Composing the Layers Source File
Check out [the sample source files folder](https://github.com/Zodiase/map-visualizer/tree/gh-pages/sample-source) to see examples.

The Souce JSON has to contain a flat list of layers and optionally some default layer configurations.

### Schema
```JSON
{
    "layers": [
        {
            "id": String,
            "title": String,
            "zIndex": Integer,
            "visible": Boolean,
            "opacity": Float,
            "extent": [Float, Float, Float, Float],
            "source": {
                "type": String,
                "options": Object
            }
        }
    ],
    "extent": [Float, Float, Float, Float],
    "projection": String
}
```

| field                  | description                                        |
|------------------------|----------------------------------------------------|
| `layer.id`             | Should be unique for each layer. Used for identifying layers. Try to keep it short.
| `layer.title`          | Displayed in the layer list.
| `layer.zIndex`         | Used to determine the rendering order, along with the position of the layer in the list; the greater the value, the higher the layer. Try to assign a unique value for each layer. If two layers have the same `zIndex`, the later layer in the list is higher.
| `layer.visible`        | Determines the visibility of the layer.
| `layer.opacity`        | Determines the opacity of the layer.
| `layer.extent`         | Extent for the layer. Data outside of the extent will not be loaded or rendered. **To improve performance, this should be specified as tight as possible.**
| `layer.source`         | Describes the data source of the layer.
| `layer.source.type`    | Name of [the constructor under `ol.source`](http://openlayers.org/en/latest/apidoc/ol.source.html), case sensitive.
| `layer.source.options` | Passed to the constructor as `opt_options`.
| `extent`               | Initial viewing window.
| `projection`           | Projection of the view. Optional. Default is `EPSG:4326`.

## Sharing with Others
Simply copy and share the url, including all the hash values, with others. They would be able to see the same view as you do (at the time of sharing).

The app stores the changes you make, including layer configurations and viewing window adjustments, in the hash string of the url.
