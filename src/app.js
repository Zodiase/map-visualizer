import {
  DefaultProjection,
  extentUpdateDelay
} from './config.js';

import {
  log,
  info,
  warn,
  error
} from './generalHelpers.js';

import {
  parseHashString,
  setHashValue
} from './locationHashHelper.js';

import {
  parseLayerConfigString
} from './layerConfigHelper.js';

import {
  isIdenticalExtent,
  buildExtentString,
  parseExtentString
} from './extentConfigHelper.js';

import {
  Viewer
} from './viewer.js';

const $mapContainer = $('#map'),
      $notificationContainer = $('#notifications');
if ($mapContainer.length === 0 || $notificationContainer.length === 0) {
  throw new ReferenceError('Can not find elements.');
}


const viewer = new Viewer({
  target: $mapContainer[0]
});

//
// // Start map loading.
// const map = new ol.Map({
//   target: $mapContainer[0],
//   controls: ol.control.defaults().extend([
//     layerListControl
//   ]),
//   view: null
// });
// const mainLayerGroup = map.getLayerGroup();
// const mainLayerCollection = mainLayerGroup.getLayers();

// Runtime data.
let
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
const startWithHash = (hash) => {
  if (busy) {
    warn('Hash update while busy!');
    location.reload();
    return;
  }
  busy = true;

  // Cancel any extent updates.
  if (extentUpdateTimer !== null) {
    window.clearTimeout(extentUpdateTimer);
    extentUpdateTimer = null;
  }

  info('Hash', hash);
  const parse = parseHashString(hash);
  info('parse', parse);
  const sourceUrl = (parse.source || '').trim();
  info('sourceUrl', sourceUrl);
  const extra = {};
  const configString = (parse.config || '').trim();
  // Config String is optional.
  extra.layerConfigs = parseLayerConfigString(configString);
  info('extra.layerConfigs', extra.layerConfigs);
  const extentString = (parse.extent || '').trim();
  // Extent String is optional.
  extra.extent = parseExtentString(extentString);
  info('extra.extent', extra.extent);
  if (loaded && sourceUrl === loadedSourceUrl) {
    // Source Url didn't change.
    log('Updating...');
    // Update layers.
    updateLayers(mainLayerCollection, extra.layerConfigs);
    // Update map view extent.
    const newExtent = (extra.extent !== null) ? extra.extent : loadedSourceData.extent;
    if (!isIdenticalExtent(fitExtent, newExtent)) {
      map.getView().fit(newExtent, map.getSize());
      fitExtent = map.getView().calculateExtent(map.getSize());
    }

    layerListControl.update(extra.layerConfigs);

    log('Updated');
    busy = false;
  } else {
    log('Loading new...');
    // Some resetting here.
    loaded = false;
    loadedSourceUrl = null;
    loadedSourceData = null;
    fitExtent = null;
    mainLayerCollection.clear();
    $notificationContainer.empty();
    layerListControl.reload([], {});
    setMapProjection(null);

    $notificationContainer.append(
      $('<div class="hashparse">')
      .append($('<div>').text(`source: ${parse.source}`))
      .append($('<div>').text(`config: ${JSON.stringify(extra.layerConfigs)}`))
      .append($('<div>').text(`extent: ${JSON.stringify(extra.extent)}`))
    );
    // Source Url is necessary.
    if (sourceUrl.length === 0) {
      // No source url available.
      warn('No source url available.');
      $notificationContainer.append($('<span>').text('No source url available.'));
      return;
    }
    log('Downloading source file...');
    $notificationContainer.append($('<span>').text('Downloading source file...'));
    $.getJSON(sourceUrl)
    .fail((jqxhr, textStatus, err) => {
      const errStr = `${textStatus}, ${err}`;
      error(errStr);
      $notificationContainer.append($('<span>').text(errStr));
    })
    .done((data) => {
      info('Downloaded', data);
      $notificationContainer.empty();
      try {
        // Load projection from source file or use default.
        setMapProjection(data.projection || DefaultProjection);
        // Load layers.
        loadLayers(mainLayerCollection, data.layers);
        // Update layers.
        updateLayers(mainLayerCollection, extra.layerConfigs);
        // Update map view extent.
        const newExtent = (extra.extent !== null) ? extra.extent : data.extent;
        map.getView().fit(newExtent, map.getSize());
        fitExtent = map.getView().calculateExtent(map.getSize());

        layerListControl.reload(data.layers, extra.layerConfigs);

        loaded = true;
        loadedSourceUrl = sourceUrl;
        loadedSourceData = data;
        log('Loaded');
      } catch (err) {
        error(err);
        $notificationContainer.append($('<span>').text(err));
      }
      busy = false;
    });
  }
};

/**
 * Set the view extent in url hash.
 * Updates the url hash when needed.
 * @param {Array.<Number>} extent
 */
const setHashViewExtent = (extent) => {
  extentUpdateTimer = null;

  // If not loaded, do nothing.
  if (!loaded) {
    return;
  }

  // Update Hash.
  const extentString = buildExtentString(extent);
  setHashValue({
    "extent": extentString
  });
};

/**
 * Handler for the start of a user interaction on the map.
 */
const userInteractionStart = () => {
  // Cancel pending extent updates.
  if (extentUpdateTimer !== null) {
    window.clearTimeout(extentUpdateTimer);
    extentUpdateTimer = null;
  }
};

/**
 * Handler for the end of a user interaction on the map.
 */
const userInteractionEnd = () => {
  // If not loaded, ignore these events.
  if (!loaded) {
    return;
  }

  // Cancel pending extent updates.
  if (extentUpdateTimer !== null) {
    window.clearTimeout(extentUpdateTimer);
    extentUpdateTimer = null;
  }

  const viewExtent = map.getView().calculateExtent(map.getSize());

  // Check if need to update extent.
  if (isIdenticalExtent(fitExtent, viewExtent)) {
    return;
  }

  fitExtent = viewExtent;

  extentUpdateTimer = window.setTimeout(setHashViewExtent.bind(this, viewExtent), extentUpdateDelay);
};

viewer.on('change:center', userInteractionStart);
viewer.on('change:resolution', userInteractionStart);
viewer.on('map/change:size', userInteractionStart);
viewer.on('map/moveend', userInteractionEnd);

$(window).on('load', () => {
  startWithHash(location.hash);
  $(window).on('hashchange', () => {
    // Need to check if Source Url has been changed.
    startWithHash(location.hash);
  });
});

window.__viewer = viewer;
