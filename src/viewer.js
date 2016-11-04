import {
  getLayerFromConfig
} from './layerSourceMapping.js';

import {
  LayerListControl
} from './ol.control.LayerList.js';

class Viewer {
  /**
   * @param {HTMLElement} options.target
   */
  constructor ({ target }) {

    // Initialize observable interface with the help of jQuery.
    this.element_ = $('<div>');

    // Initialize map.
    // Instantiate map controls.
    const layerListControl = new LayerListControl();

    this.map_ = new ol.Map({
      controls: ol.control.defaults().extend([
        layerListControl
      ]),
      view: null
    });

    this.map_.setTarget(target);

    this.mainLayerGroup_ = this.map_.getLayerGroup();
    this.mainLayerCollection_ = this.mainLayerGroup_.getLayers();

    /**
     * A map of projection => ol.View pairs.
     */
    this.mapViews_ = {};
  }

  /**
   * To exclude native DOM events, this function ensures the actual event names are unique.
   */
  encodeEventType_ (eventType) {
    return `_${eventType}`; //! Could be improved.
  }

  /**
   * To allow one set of event functions operating on multiple targets, the event type can
   * optionally have a target specified as: "target/eventType".
   * This helper function parses the generic eventType string.
   */
  parseEventType_ (eventType) {
    const result = {
            target: '',
            eventType: ''
          },
          parse = String(eventType).split('/');

    if (parse.length > 1) {
      // Last one is always the event type.
      result.eventType = parse.pop();
      result.target = parse.join('/');
    } else {
      result.eventType = eventType;
    }

    return result;
  }

  trigger (eventType, extraParameters) {
    // Check for event target.
    const parse = this.parseEventType_(eventType);

    switch (parse.target) {
      // Default target is the class instance itself.
      case '':
        // Trigger handlers bound via jQuery without also triggering the native event.
        return this.element_.triggerHandler(this.encodeEventType_(parse.eventType), extraParameters);
        break;
      case 'map':
        return this.map_.dispatchEvent(parse.eventType);
        break;
      default:
        throw new Error('Invalid target');
        break;
    }
  }

  /**
   * Register a callback for the event.
   */
  on (eventType, callback) {
    // Check for event target.
    const parse = this.parseEventType_(eventType);

    switch (parse.target) {
      // Default target is the class instance itself.
      case '':
        return this.element_.on(this.encodeEventType_(eventType), callback);
        break;
      case 'map':
        return this.map_.on(parse.eventType, callback);
        break;
      default:
        throw new Error('Invalid target');
        break;
    }
  }

  /**
   * Register a callback for the event. The callback is de-registered after running once.
   */
  one (eventType, callback) {
    // Check for event target.
    const parse = this.parseEventType_(eventType);

    switch (parse.target) {
      // Default target is the class instance itself.
      case '':
        return this.element_.one(this.encodeEventType_(eventType), callback);
        break;
      case 'map':
        return this.map_.once(parse.eventType, callback);
        break;
      default:
        throw new Error('Invalid target');
        break;
    }
  }

  /**
   * De-register a callback for the event.
   */
  off (eventType, callback) {
    // Check for event target.
    const parse = this.parseEventType_(eventType);

    switch (parse.target) {
      // Default target is the class instance itself.
      case '':
        return this.element_.off(this.encodeEventType_(eventType), callback);
        break;
      case 'map':
        return this.map_.un(parse.eventType, callback);
        break;
      default:
        throw new Error('Invalid target');
        break;
    }
  }

  /**
   * Get the map view object for the given projection.
   * Throws an error if the given projection is invalid.
   * @param {String} projName
   * @returns {ol.View}
   */
  getViewForProjection (projName) {
    const projKey = String(projName).toUpperCase();

    if (!this.mapViews_.hasOwnProperty(projKey)) {

      try {

        this.mapViews_[projKey] = new ol.View({
          projection: projKey,
          center: [0, 0],
          zoom: 0
        });

      } catch (err) {

        throw new Error(`Could not create map view for projection ${projKey}.`);

      }

    }

    return this.mapViews_[projKey];
  }

  /**
   * Update the projection of the map.
   * If null is specified, the current map view will be unloaded.
   * Throws an error if the given projection is invalid.
   * @param {String|null} projName
   */
  setMapProjection (projName) {
    const prev_mapView = this.map_.getView(),
          next_mapView = (projName === null) ? null : this.getViewForProjection(projName);

    if (prev_mapView === next_mapView) {
      return;
    }

    if (prev_mapView !== null) {

//       prev_mapView.un('change:center', userInteractionStart);
//       prev_mapView.un('change:resolution', userInteractionStart);
    }

    this.map_.setView(next_mapView);

    if (next_mapView !== null) {
//       next_mapView.on('change:center', userInteractionStart);
//       next_mapView.on('change:resolution', userInteractionStart);
    }
  }

  /**
   * Load OpenLayers layers from a list of layer configs.
   * The list of layer configs can not be empty.
   * @param {ol.Collection} currentLayerCollection
   * @param {Array.<Object>} layerConfigs
   */
  loadLayers (currentLayerCollection, layerConfigs) {
    if (!Array.isArray(layerConfigs)) {
      throw new TypeError('Expect layers to be an array.');
    }
    if (layerConfigs.length === 0) {
      throw new RangeError('There is no layer to load.');
    }
    // Create layers.
    for (let config of layerConfigs) {
      if (typeof config !== 'object') {
        throw new TypeError('Expect each layer to be an object.');
      }
      const layer = getLayerFromConfig(config);
      currentLayerCollection.push(layer);
    }
  }

  /**
   * Update the collection of OpenLayers layers with the given configs.
   * @param {Array.<ol.layer.Base>} layerCollection
   * @param {Object} extraLayerConfigs
   */
  updateLayers (layerCollection, extraLayerConfigs) {
    layerCollection.forEach((layer) => {
      const layerId = layer.get('id');
      if (extraLayerConfigs.hasOwnProperty(layerId)) {
        const extraConfig = extraLayerConfigs[layerId];
        if (extraConfig.hasOwnProperty('zIndex')) {
          layer.setZIndex(extraConfig.zIndex);
        }
        if (extraConfig.hasOwnProperty('visible')) {
          layer.setVisible(extraConfig.visible);
        }
        if (extraConfig.hasOwnProperty('opacity')) {
          layer.setOpacity(extraConfig.opacity);
        }
      }
    });
  }

}

export {
  Viewer
};
