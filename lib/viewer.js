'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function () {
  'use strict';

  var _this3 = this;

  var UrlSymbals = {
    "SemiColon": '_-_',
    "Colon": '___',
    "Comma": '_'
  };
  var DefaultProjection = 'EPSG:4326';

  /**
   * @param {String} hash
   * @returns {Object}
   */
  var parseHash = function parseHash(hash) {
    var parse = {};
    hash.substr(hash.indexOf('#') === 0 ? 1 : 0).split('&').forEach(function (segment) {
      var delimiterIndex = segment.indexOf('=');
      if (delimiterIndex > 0) {
        // Key-value pair.
        parse[decodeURIComponent(segment.substring(0, delimiterIndex))] = decodeURIComponent(segment.substring(delimiterIndex + 1));
      } else if (delimiterIndex === -1) {
        // Flag.
        parse[decodeURIComponent(segment)] = true;
      } else {
        // Invalid.
      }
    });
    return parse;
  };

  /**
   * @param {Object} map
   * @returns {String}
   */
  var buildHash = function buildHash(map) {
    var segments = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.keys(map)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var key = _step.value;

        segments.push(encodeURIComponent(key) + '=' + encodeURIComponent(map[key]));
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return segments.join('&');
  };

  /**
   * @param {Object} map
   */
  var setHashValue = function setHashValue(map) {
    var parse = parseHash(location.hash);
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = Object.keys(map)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var key = _step2.value;

        parse[key] = map[key];
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    var hash = buildHash(parse);
    location.hash = hash;
  };

  /**
   * @param {*} value
   * @returns {Boolean}
   */
  var isValidConfigValue = function isValidConfigValue(value) {
    return typeof value === 'string' && value.length > 0 && !isNaN(value);
  };

  /**
   * @param {String} configString
   * @returns {Object}
   */
  var parseLayerConfig = function parseLayerConfig(configString) {
    var layerConfigs = {};
    if (configString.length > 0) {
      configString.split(UrlSymbals.SemiColon).forEach(function (segment) {
        var delimiterIndex = segment.indexOf(UrlSymbals.Colon);
        if (delimiterIndex > 0) {
          var layerId = segment.substring(0, delimiterIndex),
              layerProps = segment.substring(delimiterIndex + UrlSymbals.Colon.length).split(UrlSymbals.Comma).map(function (value) {
            return value.trim();
          });
          layerConfigs[layerId] = {
            zIndex: isValidConfigValue(layerProps[0]) ? Number(layerProps[0]) : 0,
            visible: isValidConfigValue(layerProps[1]) ? Boolean(Number(layerProps[1])) : true,
            opacity: isValidConfigValue(layerProps[2]) ? Number(layerProps[2]) : 1
          };
        }
      });
    }
    return layerConfigs;
  };

  /**
   * @param {Array.<Object>} layerConfigs
   * @returns {String}
   */
  var buildLayerConfigString = function buildLayerConfigString(layerConfigs) {
    var segments = [];
    // Make a copy.
    var localConfigs = layerConfigs.slice(0);
    // Sort by layerId.
    localConfigs.sort(function (a, b) {
      return a.id < b.id ? -1 : 1;
    });

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = localConfigs[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var config = _step3.value;

        segments.push('' + config.id + UrlSymbals.Colon + config.zIndex + UrlSymbals.Comma + Number(config.visible) + UrlSymbals.Comma + config.opacity);
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    return segments.join(UrlSymbals.SemiColon);
  };

  /**
   * @param {String} extentString
   * @returns {Array.<Number>}
   */
  var parseExtent = function parseExtent(extentString) {
    var extentStringSegments = extentString.split(UrlSymbals.Comma).map(function (value) {
      return value.trim();
    }).filter(function (value) {
      return value.length > 0;
    });
    var extent = null;
    if (extentStringSegments.length === 4) {
      extent = extentStringSegments.map(function (value) {
        return Number(value);
      });
    }
    return extent;
  };

  /**
   * @param {Array.<Number>} extent
   * @returns {String}
   */
  var buildExtentString = function buildExtentString(extent) {
    var segments = extent.slice(0, 4);
    return segments.length === 4 ? segments.join(UrlSymbals.Comma) : '';
  };

  /**
   * @param {Array.<Number>} a
   * @param {Array.<Number>} b
   * @returns {Boolean}
   */
  var isIdenticalExtent = function isIdenticalExtent(a, b) {
    for (var i = 0; i < 4; ++i) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  };

  // @type {Object.<SourceType, LayerType>}
  var layerTypeMapping = {
    "BingMaps": "Tile",
    "CartoDB": "Tile",
    "Cluster": "Vector",
    "ImageCanvas": "Image",
    "ImageMapGuide": "Image",
    //"Image": "Image",
    "ImageStatic": "Image",
    "ImageVector": "Image",
    "ImageWMS": "Image",
    "MapQuest": "Tile",
    "OSM": "Tile",
    "Raster": "Image",
    //"Source", // Abstract
    "Stamen": "Tile",
    "TileArcGISRest": "Tile",
    "TileDebug": "Tile",
    "TileImage": "Tile",
    "TileJSON": "Tile",
    //"Tile", // Abstract
    "TileUTFGrid": "Tile",
    "TileWMS": "Tile",
    "Vector": "Vector",
    "VectorTile": "VectorTile",
    "WMTS": "Tile",
    "XYZ": "Tile",
    "Zoomify": "Tile"
  },
      supportedSourceTypes = Object.keys(layerTypeMapping),
      minOpacity = 0.1,
      maxOpacity = 1.0,
      extentUpdateDelay = 200;

  // @type {Object.<SourceType, ConvertFunction>}
  var virtualLayerTypeMapping = {
    "GeoJSON": function GeoJSON(options) {
      if (options.json) {
        var features = new ol.format.GeoJSON().readFeatures(options.json);

        return {
          "type": "Vector",
          "options": {
            features: features
          }
        };
      } else if (options.jsonFile) {
        var format = new ol.format.GeoJSON();
        var url = options.jsonFile.url;

        return {
          "type": "Vector",
          "options": {
            url: url,
            format: format
          }
        };
      } else {
        throw new RangeError('Unsupported layer source type.');
      }
    }
  },
      supportedVirtualSourceTypes = Object.keys(virtualLayerTypeMapping);

  var $mapContainer = $('#map'),
      $notificationContainer = $('#notifications');
  if ($mapContainer.length === 0 || $notificationContainer.length === 0) {
    throw new ReferenceError('Can not find elements.');
  }

  // Layer List Control constructor.
  var LayerListControl = function LayerListControl(opt_options) {
    var options = opt_options || {};

    // Internal data structure storing layers.
    // @type {Array.<Object>}
    this.layers_ = [];
    // @type {Object.<String, Object>}
    this.layerMap_ = {};

    // The actual button to toggle the layer list.
    this.toggleButton_ = document.createElement('button');
    this.toggleButton_.className = 'material-icons';
    this.toggleButton_.title = 'Toggle layer list';
    this.toggleButton_.textContent = 'layers';

    // Wrap around the button to make it look like a control.
    this.toggleButtonWrapper_ = document.createElement('div');
    this.toggleButtonWrapper_.className = 'layer-list__toggle ol-control';
    this.toggleButtonWrapper_.appendChild(this.toggleButton_);

    // Title of the layer list panel.
    this.layerListTitle_ = document.createElement('label');
    this.layerListTitle_.className = 'layer-list__title';
    this.layerListTitle_.textContent = 'Layers';

    // Body of the layer list panel.
    this.layerListBody_ = document.createElement('div');
    this.layerListBody_.className = 'layer-list__body';

    // The entire panel that slides in/out.
    this.layerListContainer_ = document.createElement('div');
    this.layerListContainer_.className = 'layer-list__container';
    this.layerListContainer_.appendChild(this.layerListTitle_);
    this.layerListContainer_.appendChild(this.layerListBody_);

    this.boundToggleLayerVisibilityHandler_ = this.toggleLayerVisibilityHandler_.bind(this);
    $(this.layerListBody_).on('click', '.' + this.CssClasses_.ItemAction_Hide, this.boundToggleLayerVisibilityHandler_);
    $(this.layerListBody_).on('touchstart', '.' + this.CssClasses_.ItemAction_Hide, this.boundToggleLayerVisibilityHandler_);

    this.boundPromoteLayerHandler_ = this.promoteLayerHandler_.bind(this);
    $(this.layerListBody_).on('click', '.' + this.CssClasses_.ItemAction_Promote, this.boundPromoteLayerHandler_);
    $(this.layerListBody_).on('touchstart', '.' + this.CssClasses_.ItemAction_Promote, this.boundPromoteLayerHandler_);

    this.boundDemoteLayerHandler_ = this.demoteLayerHandler_.bind(this);
    $(this.layerListBody_).on('click', '.' + this.CssClasses_.ItemAction_Demote, this.boundDemoteLayerHandler_);
    $(this.layerListBody_).on('touchstart', '.' + this.CssClasses_.ItemAction_Demote, this.boundDemoteLayerHandler_);

    this.boundToggleOpacityControlHandler_ = this.toggleOpacityControlHandler_.bind(this);
    $(this.layerListBody_).on('click', '.' + this.CssClasses_.ItemAction_Opacity, this.boundToggleOpacityControlHandler_);
    $(this.layerListBody_).on('touchstart', '.' + this.CssClasses_.ItemAction_Opacity, this.boundToggleOpacityControlHandler_);

    this.boundChangeLayerOpacityHandler_ = this.changeLayerOpacityHandler_.bind(this);
    $(this.layerListBody_).on('input', '.' + this.CssClasses_.ItemRow + '.row-opacity .' + this.CssClasses_.ItemRow + '__input', this.boundChangeLayerOpacityHandler_);

    this.boundToggleLayerListHandler_ = this.toggleLayerListHandler_.bind(this);
    this.toggleButton_.addEventListener('click', this.boundToggleLayerListHandler_, false);
    this.toggleButton_.addEventListener('touchstart', this.boundToggleLayerListHandler_, false);

    this.element_ = document.createElement('div');
    this.element_.className = 'layer-list ol-unselectable';
    this.element_.appendChild(this.layerListContainer_);
    this.element_.appendChild(this.toggleButtonWrapper_);

    ol.control.Control.call(this, {
      element: this.element_,
      target: options.target
    });
  };
  ol.inherits(LayerListControl, ol.control.Control);

  LayerListControl.prototype.CssClasses_ = {
    "ListExpanded": "layer-list--expanded",
    "OpacityControlExpanded": "layer-list__item--opacity-control-expanded",
    "ItemRow": "layer-list__item-row",
    "Item": "layer-list__item",
    "Item_Hidden": "layer-list__item--hidden",
    "ItemAction_Hide": "layer-list__item__action-hide",
    "ItemAction_Promote": "layer-list__item__action-promote",
    "ItemAction_Demote": "layer-list__item__action-demote",
    "ItemAction_Opacity": "layer-list__item__action-opacity"
  };

  /**
   * Compare the order of two layers.
   * @param {Object} a
   * @param {Number} a.zIndex
   * @param {Number} a.index
   * @param {Object} b
   * @param {Number} b.zIndex
   * @param {Number} b.index
   * @returns {Number}
   */
  LayerListControl.prototype.compareLayerOrder_ = function (a, b) {
    return a.zIndex === b.zIndex ? b.index - a.index : b.zIndex - a.zIndex;
  };

  /**
   * Sort the list of layer records.
   */
  LayerListControl.prototype.sortLayers_ = function () {
    this.layers_.sort(this.compareLayerOrder_);
  };

  /**
   * Handler for layer list toggles.
   * Expands or collapses the layer list.
   */
  LayerListControl.prototype.toggleLayerListHandler_ = function () {
    var viewportElement = this.getMap().getViewport();
    if (viewportElement.classList.contains(this.CssClasses_.ListExpanded)) {
      viewportElement.classList.remove(this.CssClasses_.ListExpanded);
    } else {
      viewportElement.classList.add(this.CssClasses_.ListExpanded);
    }
  };

  /**
   * Handler for layer visibility toggles.
   * Shows or hides the layer list.
   * Updates the url hash when needed.
   * @param {Object} event
   */
  LayerListControl.prototype.toggleLayerVisibilityHandler_ = function (event) {
    var button = event.currentTarget;
    var rowElement = button.parentElement;
    var layerElement = rowElement.parentElement;
    var layerId = layerElement.getAttribute('data-layer-id');
    var layer = this.layerMap_[layerId];
    layer.visible = !layer.visible;

    // Update hash.
    var configString = buildLayerConfigString(this.layers_);

    setHashValue({
      "config": configString
    });
  };

  /**
   * Handler for layer order promotions.
   * Moves the layer higher.
   * Updates the url hash when needed.
   * @param {Object} event
   */
  LayerListControl.prototype.promoteLayerHandler_ = function (event) {
    // Find this layer.
    var button = event.currentTarget;
    var rowElement = button.parentElement;
    var layerElement = rowElement.parentElement;
    var layerId = layerElement.getAttribute('data-layer-id');
    var thisLayer = this.layerMap_[layerId];
    var layerIndex = this.layers_.indexOf(thisLayer);

    // Range check.
    if (layerIndex < 0 || layerIndex >= this.layers_.length) {
      throw new RangeError('Unexpected layer index.');
    }
    if (layerIndex === 0) {
      console.warn('Can not promote top most layer.');
      return;
    }

    // Update zIndex of layers with their index in list (since the list is sorted).
    this.reIndex_();

    // Swap zIndex between this layer and its upper layer (if present).
    var upperLayer = this.layers_[layerIndex - 1];
    // Since the updated zIndex values are continuous, swapping could be done this way.
    upperLayer.zIndex--;
    thisLayer.zIndex++;

    // Update hash.
    var configString = buildLayerConfigString(this.layers_);

    setHashValue({
      "config": configString
    });
  };

  /**
   * Handler for layer order demotions.
   * Moves the layer lower.
   * Updates the url hash when needed.
   * @param {Object} event
   */
  LayerListControl.prototype.demoteLayerHandler_ = function (event) {
    // Find this layer.
    var button = event.currentTarget;
    var rowElement = button.parentElement;
    var layerElement = rowElement.parentElement;
    var layerId = layerElement.getAttribute('data-layer-id');
    var thisLayer = this.layerMap_[layerId];
    var layerIndex = this.layers_.indexOf(thisLayer);

    // Range check.
    if (layerIndex < 0 || layerIndex >= this.layers_.length) {
      throw new RangeError('Unexpected layer index.');
    }
    if (layerIndex === this.layers_.length - 1) {
      console.warn('Can not demote bottom most layer.');
      return;
    }

    // Update zIndex of layers with their index in list (since the list is sorted).
    this.reIndex_();

    // Swap zIndex between this layer and its lower layer (if present).
    var lowerLayer = this.layers_[layerIndex + 1];
    // Since the updated zIndex values are continuous, swapping could be done this way.
    lowerLayer.zIndex++;
    thisLayer.zIndex--;

    // Update hash.
    var configString = buildLayerConfigString(this.layers_);

    setHashValue({
      "config": configString
    });
  };

  /**
   * Handler for layer opacity control toggles.
   * Expands or collapses the opacity control for the layer.
   * @param {Object} event
   */
  LayerListControl.prototype.toggleOpacityControlHandler_ = function (event) {
    var button = event.currentTarget;
    var rowElement = button.parentElement;
    var layerElement = rowElement.parentElement;
    if (layerElement.classList.contains(this.CssClasses_.OpacityControlExpanded)) {
      layerElement.classList.remove(this.CssClasses_.OpacityControlExpanded);
    } else {
      layerElement.classList.add(this.CssClasses_.OpacityControlExpanded);
    }
  };

  /**
   * Handler for layer opacity changes.
   * Updates the url hash when needed.
   * @param {Object} event
   */
  LayerListControl.prototype.changeLayerOpacityHandler_ = function (event) {
    var input = event.currentTarget;
    var rowElement = input.parentElement;
    var valueLabel = rowElement.querySelector('.' + this.CssClasses_.ItemRow + '__value-label');
    var layerElement = rowElement.parentElement;
    var opacityToggle = layerElement.querySelector('.' + this.CssClasses_.ItemAction_Opacity);
    var layerId = layerElement.getAttribute('data-layer-id');
    var thisLayer = this.layerMap_[layerId];
    // @range [1, 100]
    var inputValue = input.value;
    var opacityValue = inputValue * 0.01;

    valueLabel.textContent = inputValue + '%';
    thisLayer.opacity = opacityValue;
    opacityToggle.style.opacity = opacityValue;

    if (_typeof(event.detail) === 'object' && event.detail.noUpdate) {
      // Don't update hash.
    } else {
        // Update hash.
        var configString = buildLayerConfigString(this.layers_);
        setHashValue({
          "config": configString
        });
      }
  };

  /**
   * Re-assign zIndex values to layers according to the descending order of their positions in list.
   * The result zIndex values are guaranteed to be continuous.
   */
  LayerListControl.prototype.reIndex_ = function () {
    this.layers_.forEach(function (layer, index, layers) {
      layer.zIndex = layers.length - 1 - index;
    });
  };

  /**
   * Creates an element representing a layer.
   * @param {Object} layer
   * @returns {HTMLElement}
   */
  LayerListControl.prototype.createLayerItemRowElement_ = function (layer) {
    var itemHideToggle = document.createElement('button');
    itemHideToggle.className = this.CssClasses_.ItemAction_Hide + ' material-icons';
    itemHideToggle.title = 'Toggle layer visibility';
    itemHideToggle.textContent = 'visibility_off';

    var itemLabel = document.createElement('label');
    itemLabel.className = this.CssClasses_.Item + '__label';
    itemLabel.textContent = layer.title;

    var itemPromote = document.createElement('button');
    itemPromote.className = this.CssClasses_.ItemAction_Promote + ' material-icons';
    itemPromote.title = 'Bring layer forward';
    itemPromote.textContent = 'keyboard_arrow_up';
    var itemDemote = document.createElement('button');
    itemDemote.className = this.CssClasses_.ItemAction_Demote + ' material-icons';
    itemDemote.title = 'Send layer backward';
    itemDemote.textContent = 'keyboard_arrow_down';

    var itemOpacityToggle = document.createElement('button');
    itemOpacityToggle.className = this.CssClasses_.ItemAction_Opacity + ' material-icons';
    itemOpacityToggle.title = 'Toggle opacity slider';
    itemOpacityToggle.textContent = 'opacity';
    itemOpacityToggle.style.opacity = layer.opacity;

    var itemRowMain = document.createElement('div');
    itemRowMain.className = this.CssClasses_.ItemRow;
    itemRowMain.appendChild(itemHideToggle);
    itemRowMain.appendChild(itemLabel);
    itemRowMain.appendChild(itemDemote);
    itemRowMain.appendChild(itemPromote);
    itemRowMain.appendChild(itemOpacityToggle);

    var itemRowOpacityLabel = document.createElement('label');
    itemRowOpacityLabel.className = this.CssClasses_.ItemRow + '__label';
    itemRowOpacityLabel.textContent = 'Opacity';

    var itemRowOpacityInput = document.createElement('input');
    itemRowOpacityInput.className = this.CssClasses_.ItemRow + '__input';
    itemRowOpacityInput.type = 'range';
    itemRowOpacityInput.max = maxOpacity * 100;
    itemRowOpacityInput.min = minOpacity * 100;
    itemRowOpacityInput.step = 5;
    itemRowOpacityInput.value = Math.floor(layer.opacity * 100);

    var itemRowOpacityValueLabel = document.createElement('label');
    itemRowOpacityValueLabel.className = this.CssClasses_.ItemRow + '__value-label';
    itemRowOpacityValueLabel.textContent = itemRowOpacityInput.value + '%';

    var itemRowOpacity = document.createElement('div');
    itemRowOpacity.className = this.CssClasses_.ItemRow + ' row-opacity';
    itemRowOpacity.appendChild(itemRowOpacityLabel);
    itemRowOpacity.appendChild(itemRowOpacityInput);
    itemRowOpacity.appendChild(itemRowOpacityValueLabel);

    var itemContainer = document.createElement('div');
    itemContainer.className = this.CssClasses_.Item;
    if (!layer.visible) {
      itemContainer.classList.add(this.CssClasses_.Item_Hidden);
    } else {
      itemContainer.classList.remove(this.CssClasses_.Item_Hidden);
    }
    itemContainer.setAttribute('data-layer-id', layer.id);
    itemContainer.appendChild(itemRowMain);
    itemContainer.appendChild(itemRowOpacity);

    return itemContainer;
  };

  /**
   * Reload everything in the list from the provided layer configs and extra configs.
   * @param {Array.<Object>} layerConfigs
   * @param {Object} extraLayerConfigs
   */
  LayerListControl.prototype.reload = function (layerConfigs, extraLayerConfigs) {
    var _this = this;

    var container = this.layerListBody_;

    // Reset.
    while (container.lastChild) {
      container.removeChild(container.lastChild);
    }
    this.layers_.length = 0;
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = Object.keys(this.layerMap_)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var key = _step4.value;

        delete this.layerMap_[key];
      }

      // Load layers into internal data structure.
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return) {
          _iterator4.return();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }

    layerConfigs.forEach(function (config, index) {
      var layerId = config.id;
      var newLayer = {
        "index": index,
        "id": layerId,
        "title": config.title,
        "zIndex": config.zIndex,
        "visible": config.visible,
        "opacity": config.opacity
      };

      if (extraLayerConfigs.hasOwnProperty(layerId)) {
        var extraConfig = extraLayerConfigs[layerId];
        var _arr = ['zIndex', 'visible', 'opacity'];
        for (var _i = 0; _i < _arr.length; _i++) {
          var propName = _arr[_i];
          if (extraConfig.hasOwnProperty(propName)) {
            newLayer[propName] = extraConfig[propName];
          }
        }
      }

      _this.layers_.push(newLayer);
      _this.layerMap_[layerId] = newLayer;
    });

    this.sortLayers_();

    // Build DOM.
    this.layers_.forEach(function (layer) {
      container.appendChild(_this.createLayerItemRowElement_(layer));
    });
  };

  /**
   * Update the list with the provided extra configs.
   * @param {Object} extraLayerConfigs
   */
  LayerListControl.prototype.update = function (extraLayerConfigs) {
    var _this2 = this;

    var container = this.layerListBody_;

    // Update internal layers.
    this.layers_.forEach(function (layer) {
      var layerId = layer.id;

      if (extraLayerConfigs.hasOwnProperty(layerId)) {
        var extraConfig = extraLayerConfigs[layerId];
        var _arr2 = ['zIndex', 'visible', 'opacity'];
        for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
          var propName = _arr2[_i2];
          if (extraConfig.hasOwnProperty(propName)) {
            layer[propName] = extraConfig[propName];
          }
        }
      }
    });

    // Get a layer-index mapping in order to detect changes in order.
    var orderMap = {};
    this.layers_.forEach(function (layer, index) {
      orderMap[layer.id] = index;
    });

    this.sortLayers_();

    // Check if the order is changed.
    var orderChanged = false;
    this.layers_.forEach(function (layer, index) {
      if (orderMap[layer.id] !== index) {
        orderChanged = true;
      }
    });

    // Update DOM.
    var $listItems = $(container).children('.' + this.CssClasses_.Item);
    // Only re-order the list elements when necessary.
    if (orderChanged) {
      $(container).append($listItems.detach().sort(function (a, b) {
        var layerIdA = a.getAttribute('data-layer-id'),
            layerIdB = b.getAttribute('data-layer-id');
        var layerA = _this2.layerMap_[layerIdA],
            layerB = _this2.layerMap_[layerIdB];
        return _this2.compareLayerOrder_(layerA, layerB);
      }));
    }
    // Update each item.
    var this_ = this;
    $listItems.each(function () {
      // `this` is the element.
      var layerRowElement = this;

      var layerId = layerRowElement.getAttribute('data-layer-id');
      var layer = this_.layerMap_[layerId];

      if (!layer.visible) {
        layerRowElement.classList.add(this_.CssClasses_.Item_Hidden);
      } else {
        layerRowElement.classList.remove(this_.CssClasses_.Item_Hidden);
      }

      var opacityRow = layerRowElement.querySelector('.' + this_.CssClasses_.ItemRow + '.row-opacity');
      var opacityInput = opacityRow.querySelector('.' + this_.CssClasses_.ItemRow + '__input');
      var opacityInputValue = Math.floor(layer.opacity * 100);
      if (opacityInput.value !== opacityInputValue) {
        opacityInput.value = opacityInputValue;
      }
      this_.boundChangeLayerOpacityHandler_({
        currentTarget: opacityInput,
        target: opacityInput,
        detail: {
          noUpdate: true
        }
      });
    });
  };

  // Instantiate map controls.
  var layerListControl = new LayerListControl();

  // Start map loading.
  var map = new ol.Map({
    target: $mapContainer[0],
    controls: ol.control.defaults().extend([layerListControl]),
    view: null
  });
  var mainLayerGroup = map.getLayerGroup();
  var mainLayerCollection = mainLayerGroup.getLayers();

  /**
   * A map of projection => ol.View pairs.
   */
  var _mapViews = {};
  /**
   * Get the map view object for the given projection.
   * Throws an error if the given projection is invalid.
   * @param {String} projName
   * @returns {ol.View}
   */
  var getViewForProjection = function getViewForProjection(projName) {
    var projKey = String(projName).toUpperCase();
    if (!_mapViews.hasOwnProperty(projKey)) {
      try {
        _mapViews[projKey] = new ol.View({
          projection: projKey,
          center: [0, 0],
          zoom: 0
        });
      } catch (error) {
        throw new Error('Could not create map view for projection ' + projKey + '.');
      }
    }
    return _mapViews[projKey];
  };
  /**
   * Update the projection of the map.
   * If null is specified, the current map view will be unloaded.
   * Throws an error if the given projection is invalid.
   * @param {String|null} projName
   */
  var setMapProjection = function setMapProjection(projName) {
    var prev_mapView = map.getView(),
        next_mapView = projName === null ? null : getViewForProjection(projName);

    if (prev_mapView === next_mapView) {
      return;
    }

    if (prev_mapView !== null) {
      prev_mapView.un('change:center', userInteractionStart);
      prev_mapView.un('change:resolution', userInteractionStart);
    }

    map.setView(next_mapView);

    if (next_mapView !== null) {
      next_mapView.on('change:center', userInteractionStart);
      next_mapView.on('change:resolution', userInteractionStart);
    }
  };

  // Runtime data.
  var
  /**
   * If true, the app is busy processing a hash change.
   * @type {Boolean}
   */
  busy = false,

  /**
   * If true, the app has successfully loaded a valid source file.
   * @type {Boolean}
   */
  loaded = false,

  /**
   * If loaded is true, this is the url of the loaded source file.
   * @type {String|null}
   */
  loadedSourceUrl = null,

  /**
   * If loaded is true, this is the data of the loaded source file.
   * @type {Object|null}
   */
  loadedSourceData = null,

  /**
   * Stores the ID of the timer that is used to update the extent config in the url.
   * @type {Number|null}
   */
  extentUpdateTimer = null,

  /**
   * Stores the last fitted stable map view extent.
   * @type {Array.<Number>|null}
   */
  fitExtent = null;

  /**
   * Start or restart the app with the given hash string.
   * @param {String} hash
   */
  var startWithHash = function startWithHash(hash) {
    if (busy) {
      console.warn('Hash update while busy!');
      location.reload();
      return;
    }
    busy = true;

    // Cancel any extent updates.
    if (extentUpdateTimer !== null) {
      window.clearTimeout(extentUpdateTimer);
      extentUpdateTimer = null;
    }

    console.info('Hash', hash);
    var parse = parseHash(hash);
    console.info('parse', parse);
    var sourceUrl = (parse.source || '').trim();
    console.info('sourceUrl', sourceUrl);
    var extra = {};
    var configString = (parse.config || '').trim();
    // Config String is optional.
    extra.layerConfigs = parseLayerConfig(configString);
    console.info('extra.layerConfigs', extra.layerConfigs);
    var extentString = (parse.extent || '').trim();
    // Extent String is optional.
    extra.extent = parseExtent(extentString);
    console.info('extra.extent', extra.extent);
    if (loaded && sourceUrl === loadedSourceUrl) {
      // Source Url didn't change.
      console.log('Updating...');
      // Update layers.
      updateLayers(mainLayerCollection, extra.layerConfigs);
      // Update map view extent.
      var newExtent = extra.extent !== null ? extra.extent : loadedSourceData.extent;
      if (!isIdenticalExtent(fitExtent, newExtent)) {
        map.getView().fit(newExtent, map.getSize());
        fitExtent = map.getView().calculateExtent(map.getSize());
      }

      layerListControl.update(extra.layerConfigs);

      console.log('Updated');
      busy = false;
    } else {
      console.log('Loading new...');
      // Some resetting here.
      loaded = false;
      loadedSourceUrl = null;
      loadedSourceData = null;
      fitExtent = null;
      mainLayerCollection.clear();
      $notificationContainer.empty();
      layerListControl.reload([], {});
      setMapProjection(null);

      $notificationContainer.append($('<div class="hashparse">').append($('<div>').text('source: ' + parse.source)).append($('<div>').text('config: ' + JSON.stringify(extra.layerConfigs))).append($('<div>').text('extent: ' + JSON.stringify(extra.extent))));
      // Source Url is necessary.
      if (sourceUrl.length === 0) {
        // No source url available.
        console.warn('No source url available.');
        $notificationContainer.append($('<span>').text('No source url available.'));
        return;
      }
      console.log('Downloading source file...');
      $notificationContainer.append($('<span>').text('Downloading source file...'));
      $.getJSON(sourceUrl).fail(function (jqxhr, textStatus, error) {
        var err = textStatus + ', ' + error;
        console.error(err);
        $notificationContainer.append($('<span>').text(err));
      }).done(function (data) {
        console.info('Downloaded', data);
        $notificationContainer.empty();
        try {
          // Load projection from source file or use default.
          setMapProjection(data.projection || DefaultProjection);
          // Load layers.
          loadLayers.call(mainLayerCollection, data.layers);
          // Update layers.
          updateLayers(mainLayerCollection, extra.layerConfigs);
          // Update map view extent.
          var _newExtent = extra.extent !== null ? extra.extent : data.extent;
          map.getView().fit(_newExtent, map.getSize());
          fitExtent = map.getView().calculateExtent(map.getSize());

          layerListControl.reload(data.layers, extra.layerConfigs);

          loaded = true;
          loadedSourceUrl = sourceUrl;
          loadedSourceData = data;
          console.log('Loaded');
        } catch (err) {
          console.error(err);
          $notificationContainer.append($('<span>').text(err));
        }
        busy = false;
      });
    }
  };

  /**
   * Load OpenLayers layers from a list of layer configs.
   * The list of layer configs can not be empty.
   * @param {Array.<Object>} layerConfigs
   */
  var loadLayers = function loadLayers(layerConfigs) {
    if (!Array.isArray(layerConfigs)) {
      throw new TypeError('Expect layers to be an array.');
    }
    if (layerConfigs.length === 0) {
      throw new RangeError('There is no layer to load.');
    }
    // Create layers.
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = layerConfigs[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var config = _step5.value;

        if ((typeof config === 'undefined' ? 'undefined' : _typeof(config)) !== 'object') {
          throw new TypeError('Expect each layer to be an object.');
        }
        if (typeof config.id !== 'string') {
          throw new TypeError('Expect layer ID to be a string.');
        }
        if (typeof config.title !== 'string') {
          throw new TypeError('Expect layer title to be a string.');
        }
        if (typeof config.zIndex !== 'number') {
          throw new TypeError('Expect layer z-index to be a number.');
        }
        if (typeof config.visible !== 'boolean') {
          throw new TypeError('Expect layer visibility to be a boolean.');
        }
        if (typeof config.opacity !== 'number') {
          throw new TypeError('Expect layer opacity to be a number.');
        }
        if (config.opacity < minOpacity || config.opacity > maxOpacity) {
          throw new RangeError('Invalid layer opacity value.');
        }
        if (typeof config.extent !== 'undefined') {
          if (!Array.isArray(config.extent)) {
            throw new TypeError('Expect layer extent to be an array.');
          }
          if (config.extent.length !== 4) {
            throw new RangeError('Expect layer extent to be an array of length 4.');
          }
          var _iteratorNormalCompletion6 = true;
          var _didIteratorError6 = false;
          var _iteratorError6 = undefined;

          try {
            for (var _iterator6 = config.extent[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
              var cell = _step6.value;

              if (typeof cell !== 'number') {
                throw new TypeError('Expect layer extent to contain only numbers.');
              }
            }
          } catch (err) {
            _didIteratorError6 = true;
            _iteratorError6 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
              }
            } finally {
              if (_didIteratorError6) {
                throw _iteratorError6;
              }
            }
          }
        }
        if (supportedVirtualSourceTypes.indexOf(config.source.type) !== -1) {
          config.source = virtualLayerTypeMapping[config.source.type](config.source.options);
        }
        if (_typeof(config.source) !== 'object') {
          throw new TypeError('Expect layer source to be an object.');
        }
        if (typeof config.source.type !== 'string') {
          throw new TypeError('Expect layer source type to be a string.');
        }
        if (_typeof(config.source.options) !== 'object') {
          throw new TypeError('Expect layer source options to be an object.');
        }
        if (supportedSourceTypes.indexOf(config.source.type) === -1) {
          throw new RangeError('Unsupported layer source type.');
        }
        var layerSource = new ol.source[config.source.type](config.source.options);
        var layerType = layerTypeMapping[config.source.type];
        var layer = new ol.layer[layerType]({
          id: config.id,
          title: config.title,
          source: layerSource,
          opacity: config.opacity,
          visible: config.visible,
          extent: config.extent,
          zIndex: config.zIndex
        });
        this.push(layer);
      }
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5.return) {
          _iterator5.return();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }
  };

  /**
   * Update the collection of OpenLayers layers with the given configs.
   * @param {Array.<ol.layer.Base>} layerCollection
   * @param {Object} extraLayerConfigs
   */
  var updateLayers = function updateLayers(layerCollection, extraLayerConfigs) {
    layerCollection.forEach(function (layer) {
      var layerId = layer.get('id');
      if (extraLayerConfigs.hasOwnProperty(layerId)) {
        var extraConfig = extraLayerConfigs[layerId];
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
  };

  /**
   * Set the view extent in url hash.
   * Updates the url hash when needed.
   * @param {Array.<Number>} extent
   */
  var setHashViewExtent = function setHashViewExtent(extent) {
    extentUpdateTimer = null;

    // If not loaded, do nothing.
    if (!loaded) {
      return;
    }

    // Update Hash.
    var extentString = buildExtentString(extent);
    setHashValue({
      "extent": extentString
    });
  };

  /**
   * Handler for the start of a user interaction on the map.
   */
  var userInteractionStart = function userInteractionStart() {
    // Cancel pending extent updates.
    if (extentUpdateTimer !== null) {
      window.clearTimeout(extentUpdateTimer);
      extentUpdateTimer = null;
    }
  };

  /**
   * Handler for the end of a user interaction on the map.
   */
  var userInteractionEnd = function userInteractionEnd() {
    // If not loaded, ignore these events.
    if (!loaded) {
      return;
    }

    // Cancel pending extent updates.
    if (extentUpdateTimer !== null) {
      window.clearTimeout(extentUpdateTimer);
      extentUpdateTimer = null;
    }

    var viewExtent = map.getView().calculateExtent(map.getSize());

    // Check if need to update extent.
    if (isIdenticalExtent(fitExtent, viewExtent)) {
      return;
    }

    fitExtent = viewExtent;

    extentUpdateTimer = window.setTimeout(setHashViewExtent.bind(_this3, viewExtent), extentUpdateDelay);
  };

  map.on('moveend', userInteractionEnd);
  map.on('change:size', userInteractionStart);

  $(window).on('load', function () {
    startWithHash(location.hash);
    $(window).on('hashchange', function () {
      // Need to check if Source Url has been changed.
      startWithHash(location.hash);
    });
  });

  window.__map = map;
})();