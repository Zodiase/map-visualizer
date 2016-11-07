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
  constructor ({target}) {

    /**
     * Initialize observable interface with the help of jQuery.
     * Event handlers are attached to this object.
     */
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
   * To exclude native DOM events, this function ensures the actual event names are distinct.
   * @param {string} eventType
   * @return {string}
   */
  encodeEventType_ (eventType) {
    //! Could be improved.
    return `_${eventType}`;
  }

  /**
   * To allow one set of event functions operating on multiple targets, the event type can
   * optionally have a target specified as: "target/eventType".
   * This helper function parses the generic eventType string.
   * @param {string} eventType
   * @return {{target: string, eventType: string}}
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

  /**
   * Helper to run specific event related actions (binding, unbinding and triggering).
   * @param {string} target - The target that the events belong to. Different targets might have different event binding/triggering APIs.
   * @param {string} actionType - The type of action to run. Actions could be 'trigger', 'on', 'one' or 'off'.
   * @param {Array} args - List of arguments for the action.
   * @return {*}
   */
  performEventAction_ (target, actionType, args) {
    if (this.eventMapping_.hasOwnProperty(target)) {
      const targetActions = this.eventMapping_[target];
      if (typeof targetActions[actionType] === 'function') {
        return targetActions[actionType].apply(this, args);
      } else {
        throw new Error('Invalid action type');
      }
    } else {
      throw new Error('Invalid target');
    }
  }

  /**
   * Execute all handlers and behaviors attached to the target for the given event type.
   * @param {string} eventType - A string containing a JavaScript event type, such as `click` or `submit`.
   * @param {Array} extraParameters - Additional parameters to pass along to the event handler.
   * @return {*}
   */
  trigger (eventType, extraParameters) {
    const parse = this.parseEventType_(eventType);
    return this.performEventAction_(parse.target, 'trigger', [parse.eventType, extraParameters]);
  }

  /**
   * Attach an event handler function for the event to the target.
   * @param {string} eventType - The type of the event and optional namespaces.
   * @param {Function} callback - A function to execute when the event is triggered.
   * @return {*}
   */
  on (eventType, callback) {
    const parse = this.parseEventType_(eventType);
    return this.performEventAction_(parse.target, 'on', [parse.eventType, callback]);
  }

  /**
   * Attach a handler to an event for the target. The handler is executed at most once per target per event type.
   * @param {string} eventType - The type of the event and optional namespaces.
   * @param {Function} callback - A function to execute when the event is triggered.
   * @return {*}
   */
  one (eventType, callback) {
    const parse = this.parseEventType_(eventType);
    return this.performEventAction_(parse.target, 'one', [parse.eventType, callback]);
  }

  /**
   * Remove an event handler.
   * @param {string} eventType - The type of the event and optional namespaces.
   * @param {Function} callback - A handler function previously attached for the event(s).
   * @return {*}
   */
  off (eventType, callback) {
    const parse = this.parseEventType_(eventType);
    return this.performEventAction_(parse.target, 'off', [parse.eventType, callback]);
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
Viewer.prototype.eventMapping_ = {
  '': {
    trigger (eventType, extraParameters) {
      return this.element_.triggerHandler(this.encodeEventType_(eventType), extraParameters);
    },
    on (eventType, callback) {
      return this.element_.on(this.encodeEventType_(eventType), callback);
    },
    one (eventType, callback) {
      return this.element_.one(this.encodeEventType_(eventType), callback);
    },
    off (eventType, callback) {
      return this.element_.off(this.encodeEventType_(eventType), callback);
    }
  },
  'map': {
    trigger (eventType, extraParameters) {
      // For openlayers there is no way to send extra parameters to the event handler so `extraParameters` is discarded.
      return this.map_.dispatchEvent(eventType);
    },
    on (eventType, callback) {
      return this.map_.on(eventType, callback);
    },
    one (eventType, callback) {
      return this.map_.once(eventType, callback);
    },
    off (eventType, callback) {
      return this.map_.un(eventType, callback);
    }
  }
};

export {
  Viewer
};
