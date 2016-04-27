(function () {
  'use strict';

  const UrlSymbals = {
    "SemiColon": '_-_',
    "Colon": '___',
    "Comma": '_'
  };

  /**
   * @param {String} hash
   * @returns {Object}
   */
  const parseHash = (hash) => {
    let parse = {};
    hash.substr((hash.indexOf('#') === 0) ? 1 : 0).split('&').forEach((segment) => {
      const delimiterIndex = segment.indexOf('=');
      if (delimiterIndex > 0) {
        // Key-value pair.
        parse[decodeURIComponent(segment.substring(0, delimiterIndex))] =
          decodeURIComponent(segment.substring(delimiterIndex + 1));
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
  const buildHash = (map) => {
    let segments = [];
    for (let key of Object.keys(map)) {
      segments.push(`${encodeURIComponent(key)}=${encodeURIComponent(map[key])}`);
    }
    return segments.join('&');
  };

  /**
   * @param {Object} map
   */
  const setHashValue = (map) => {
    const parse = parseHash(location.hash);
    for (let key of Object.keys(map)) {
      parse[key] = map[key];
    }
    const hash = buildHash(parse);
    location.hash = hash;
  };

  /**
   * @param {*} value
   * @returns {Boolean}
   */
  const isValidConfigValue = (value) => {
    return typeof value === 'string' && value.length > 0 && !isNaN(value);
  };

  /**
   * @param {String} configString
   * @returns {Object}
   */
  const parseLayerConfig = (configString) => {
    const layerConfigs = {};
    if (configString.length > 0) {
      configString.split(UrlSymbals.SemiColon).forEach((segment) => {
        const delimiterIndex = segment.indexOf(UrlSymbals.Colon);
        if (delimiterIndex > 0) {
          const layerId = segment.substring(0, delimiterIndex),
                layerProps = segment.substring(delimiterIndex + UrlSymbals.Colon.length).split(UrlSymbals.Comma).map((value) => value.trim());
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
  const buildLayerConfigString = (layerConfigs) => {
    const segments = [];
    for (let config of layerConfigs) {
      segments.push(`${config.id}${UrlSymbals.Colon}${config.zIndex}${UrlSymbals.Comma}${Number(config.visible)}${UrlSymbals.Comma}${config.opacity}`);
    }
    return segments.join(UrlSymbals.SemiColon);
  };

  /**
   * @param {String} extentString
   * @returns {Array.<Number>}
   */
  const parseExtent = (extentString) => {
    const extentStringSegments = extentString.split(UrlSymbals.Comma).map((value) => value.trim()).filter((value) => value.length > 0);
    let extent = null;
    if (extentStringSegments.length === 4) {
      extent = extentStringSegments.map((value) => Number(value));
    }
    return extent;
  };

  /**
   * @param {Array.<Number>} extent
   * @returns {String}
   */
  const buildExtentString = (extent) => {
    const segments = extent.slice(0, 4);
    return (segments.length === 4) ? segments.join(UrlSymbals.Comma) : '';
  };

  // @type {Object.<SourceType, LayerType>}
  const layerTypeMapping = {
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
        supportedSourceTypes = Object.keys(layerTypeMapping);

  const $mapContainer = $('#map'),
        $notificationContainer = $('#notifications');
  if ($mapContainer.length === 0 || $notificationContainer.length === 0) {
    throw new ReferenceError('Can not find elements.');
  }

  // Layer List Control.
  const LayerListControl = function (opt_options) {
    const options = opt_options || {};

    // Internal data structure storing layers.
    this.layers_ = [];
    this.layerMap_ = new Map();

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
    $(this.layerListBody_).on('click', `.${this.CssClasses_.ItemAction_Hide}`, this.boundToggleLayerVisibilityHandler_);
    $(this.layerListBody_).on('touchstart', `.${this.CssClasses_.ItemAction_Hide}`, this.boundToggleLayerVisibilityHandler_);

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
    "Item": "layer-list__item",
    "Item_Hidden": "layer-list__item--hidden",
    "ItemAction_Hide": "layer-list__item__action-hide",
    "ItemAction_Promote": "layer-list__item__action-promote",
    "ItemAction_Demote": "layer-list__item__action-demote"
  };
  LayerListControl.prototype.compareLayerOrder_ = (a, b) => (a.zIndex === b.zIndex) ? (b.index - a.index) : (b.zIndex - a.zIndex);
  LayerListControl.prototype.sortLayers_ = function () {
    this.layers_.sort(this.compareLayerOrder_);
  };
  LayerListControl.prototype.toggleLayerListHandler_ = function () {
    const viewportElement = this.getMap().getViewport();
    if (viewportElement.classList.contains(this.CssClasses_.ListExpanded)) {
      viewportElement.classList.remove(this.CssClasses_.ListExpanded);
    } else {
      viewportElement.classList.add(this.CssClasses_.ListExpanded);
    }
  };
  LayerListControl.prototype.toggleLayerVisibilityHandler_ = function (event) {
    const button = event.currentTarget;
    const layerRowElement = button.parentElement;
    const layerId = layerRowElement.getAttribute('data-layer-id');
    const layer = this.layerMap_.get(layerId);
    layer.visible = !layer.visible;

    // Update hash.
    const configString = buildLayerConfigString(this.layers_);
    setHashValue({
      "config": configString
    });
  };
  /**
   * Reload everything in the list from the provided layer configs and extra configs.
   * @param {Array.<Object>} layerConfigs
   * @param {Object} extraLayerConfigs
   */
  LayerListControl.prototype.reload = function (layerConfigs, extraLayerConfigs) {
    const container = this.layerListBody_;
    
    // Reset.
    while (container.lastChild) {
      container.removeChild(container.lastChild);
    }
    this.layers_.length = 0;
    this.layerMap_.clear();

    // Load layers into internal data structure.
    layerConfigs.forEach((config, index) => {
      const layerId = config.id;
      const newLayer = {
        "index": index,
        "id": layerId,
        "title": config.title,
        "zIndex": config.zIndex,
        "visible": config.visible,
        "opacity": config.opacity
      };

      if (extraLayerConfigs.hasOwnProperty(layerId)) {
        const extraConfig = extraLayerConfigs[layerId];
        for (let propName of ['zIndex', 'visible', 'opacity']) {
          if (extraConfig.hasOwnProperty(propName)) {
            newLayer[propName] = extraConfig[propName];
          }
        }
      }

      this.layers_.push(newLayer);
      this.layerMap_.set(layerId, newLayer);
    });

    this.sortLayers_();

    // Build DOM.
    this.layers_.forEach((layer) => {
      const itemHideToggle = document.createElement('button');
      itemHideToggle.className = `${this.CssClasses_.ItemAction_Hide} material-icons`;
      itemHideToggle.title = 'Toggle layer visibility';
      itemHideToggle.textContent = 'visibility_off';

      const itemLabel = document.createElement('label');
      itemLabel.className = `${this.CssClasses_.Item}__label`;
      itemLabel.textContent = layer.title;

      const itemPromote = document.createElement('button');
      itemPromote.className = `${this.CssClasses_.ItemAction_Promote} material-icons`;
      itemPromote.title = 'Bring layer forward';
      itemPromote.textContent = 'keyboard_arrow_up';
      const itemDemote = document.createElement('button');
      itemDemote.className = `${this.CssClasses_.ItemAction_Demote} material-icons`;
      itemDemote.title = 'Send layer backward';
      itemDemote.textContent = 'keyboard_arrow_down';

      const itemContainer = document.createElement('div');
      itemContainer.className = this.CssClasses_.Item;
      if (!layer.visible) {
        itemContainer.classList.add(this.CssClasses_.Item_Hidden);
      } else {
        itemContainer.classList.remove(this.CssClasses_.Item_Hidden);
      }
      itemContainer.setAttribute('data-layer-id', layer.id);
      itemContainer.appendChild(itemHideToggle);
      itemContainer.appendChild(itemLabel);
      itemContainer.appendChild(itemDemote);
      itemContainer.appendChild(itemPromote);

      container.appendChild(itemContainer);
    });

  };
  /**
   * Update the list with the provided extra configs.
   * @param {Object} extraLayerConfigs
   */
  LayerListControl.prototype.update = function (extraLayerConfigs) {
    const container = this.layerListBody_;

    // Update internal layers.
    this.layers_.forEach((layer) => {
      const layerId = layer.id;

      if (extraLayerConfigs.hasOwnProperty(layerId)) {
        const extraConfig = extraLayerConfigs[layerId];
        for (let propName of ['zIndex', 'visible', 'opacity']) {
          if (extraConfig.hasOwnProperty(propName)) {
            layer[propName] = extraConfig[propName];
          }
        }
      }
    });

    this.sortLayers_();

    //! Implement this.
    const orderChanged = true;
    // Update DOM.
    const $listItems = $(container).children(`.${this.CssClasses_.Item}`);
    // Only re-order the list elements when necessary.
    if (orderChanged) {
      $(container).append(
          $listItems.detach().sort((a, b) => {
            const layerIdA = a.getAttribute('data-layer-id'),
                  layerIdB = b.getAttribute('data-layer-id');
            const layerA = this.layerMap_.get(layerIdA),
                  layerB = this.layerMap_.get(layerIdB);
            return this.compareLayerOrder_(layerA, layerB);
          })
      );
    }
    // Update each item.
    const this_ = this;
    $listItems.each(function () {
      // `this` is the element.
      const layerId = this.getAttribute('data-layer-id');
      const layer = this_.layerMap_.get(layerId);
      if (!layer.visible) {
        this.classList.add(this_.CssClasses_.Item_Hidden);
      } else {
        this.classList.remove(this_.CssClasses_.Item_Hidden);
      }
    });
  };
  const layerListControl = new LayerListControl();

  // Start map loading.
  const map = new ol.Map({
    target: $mapContainer[0],
    controls: ol.control.defaults().extend([
      layerListControl
    ]),
    view: new ol.View({
      center: [0, 0],
      zoom: 0
    })
  });
  const mainLayerGroup = map.getLayerGroup();
  const mainLayerCollection = mainLayerGroup.getLayers();

  // Runtime data.
  let busy = false,
      loaded = false,
      loadedSourceUrl = null;

  const startWithHash = (hash) => {
    if (busy) {
      console.warn('Hash update while busy!');
      location.reload();
      return;
    }
    busy = true;
    console.info('Hash', hash);
    const parse = parseHash(hash);
    console.info('parse', parse);
    const sourceUrl = (parse.source || '').trim();
    console.info('sourceUrl', sourceUrl);
    const extra = {};
    const configString = (parse.config || '').trim();
    // Config String is optional.
    extra.layerConfigs = parseLayerConfig(configString);
    console.info('extra.layerConfigs', extra.layerConfigs);
    const extentString = (parse.extent || '').trim();
    // Extent String is optional.
    extra.extent = parseExtent(extentString);
    console.info('extra.extent', extra.extent);
    if (loaded && sourceUrl === loadedSourceUrl) {
      // Source Url didn't change.
      console.warn('Updating...');
      // Update layers.
      updateLayers.call(mainLayerCollection, extra.layerConfigs);
      //! Update map view extent.

      layerListControl.update(extra.layerConfigs);

      console.log('Updated');
      busy = false;
    } else {
      console.warn('Loading new...');
      // Some resetting here.
      loaded = false;
      mainLayerCollection.clear();
      $notificationContainer.empty();
      $notificationContainer.append($('<span>').text(hash));
      // Source Url is necessary.
      if (sourceUrl.length === 0) {
        // No source url available.
        console.warn('No source url available.');
        $notificationContainer.append($('<span>').text('No source url available.'));
        return;
      }
      console.log('Downloading source file...');
      $notificationContainer.append($('<span>').text('Downloading source file...'));
      const JSONP_URL = (sourceUrl.indexOf('?') > -1) ? `${sourceUrl}&jsoncallback=?` : `${sourceUrl}?jsoncallback=?`;
      $.getJSON(sourceUrl)
      .fail((jqxhr, textStatus, error) => {
        const err = `${textStatus}, ${error}`;
        console.error(err);
        $notificationContainer.append($('<span>').text(err));
      })
      .done((data, textStatus, jqxhr) => {
        console.info('Downloaded', data);
        $notificationContainer.empty();
        try {
          // Load layers.
          loadLayers.call(mainLayerCollection, data.layers);
          // Update layers.
          updateLayers.call(mainLayerCollection, extra.layerConfigs);
          //! Update map view extent.

          layerListControl.reload(data.layers, extra.layerConfigs);

          loaded = true;
          loadedSourceUrl = sourceUrl;
          console.log('Loaded');
        } catch (err) {
          console.error(err);
          $notificationContainer.append($('<span>').text(err));
        }
        busy = false;
      });
    }
  };

  const loadLayers = function (layerConfigs) {
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
      if (typeof config.extent !== 'undefined') {
        if (!Array.isArray(config.extent)) {
          throw new TypeError('Expect layer extent to be an array.');
        }
        if (config.extent.length !== 4) {
          throw new RangeError('Expect layer extent to be an array of length 4.');
        }
        for (let cell of config.extent) {
          if (typeof cell !== 'number') {
            throw new TypeError('Expect layer extent to contain only numbers.');
          }
        }
      }
      if (typeof config.source !== 'object') {
        throw new TypeError('Expect layer source to be an object.');
      }
      if (typeof config.source.type !== 'string') {
        throw new TypeError('Expect layer source type to be a string.');
      }
      if (typeof config.source.options !== 'object') {
        throw new TypeError('Expect layer source options to be an object.');
      }
      if (supportedSourceTypes.indexOf(config.source.type) === -1) {
        throw new RangeError('Unsupported layer source type.');
      }
      const layerSource = new ol.source[config.source.type](config.source.options);
      console.info('layerSource', layerSource);
      const layerType = layerTypeMapping[config.source.type];
      const layer = new ol.layer[layerType]({
        id: config.id,
        title: config.title,
        source: layerSource,
        opacity: config.opacity,
        visible: config.visible,
        extent: config.extent,
        zIndex: config.zIndex
      });
      console.info('layer', layer);
      this.push(layer);
    }
  };

  const updateLayers = function (extraLayerConfigs) {
    this.forEach((layer) => {
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
  };

  $(window).on('load', () => {
    startWithHash(location.hash);
    $(window).on('hashchange', () => {
      // Need to check if Source Url has been changed.
      startWithHash(location.hash);
    });
  });
})();
