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

class App {
  /**
   * @param {string} options.mapContainerSelector
   * @param {string} options.notificationContainerSelector
   */
  constructor ({mapContainerSelector, notificationContainerSelector}) {
    this.$mapContainer_ = $(mapContainerSelector);
    this.$notificationContainer_ = $(notificationContainerSelector);
    if (this.$mapContainer_.length === 0 || this.$notificationContainer_.length === 0) {
      throw new ReferenceError('Can not find elements.');
    }

    this.viewer_ = new Viewer({
      target: this.$mapContainer_[0]
    });

    // Runtime data.
    /**
     * If true, the app is busy processing a hash change.
     * @type {Boolean}
     */
    this.busy_ = false;
    /**
     * If true, the app has successfully loaded a valid source file.
     * @type {Boolean}
     */
    this.loaded_ = false;
    /**
     * If loaded is true, this is the url of the loaded source file.
     * @type {String|null}
     */
    this.loadedSourceUrl_ = null;
    /**
     * If loaded is true, this is the data of the loaded source file.
     * @type {Object|null}
     */
    this.loadedSourceData_ = null;
    /**
     * Stores the ID of the timer that is used to update the extent config in the url.
     * @type {Number|null}
     */
    this.extentUpdateTimer_ = null;
    /**
     * Stores the last fitted stable map view extent.
     * @type {Array.<Number>|null}
     */
    this.fitExtent_ = null;

    this.boundUserInteractionStart_ = this.userInteractionStart_.bind(this);
    this.boundUserInteractionEnd_ = this.userInteractionEnd_.bind(this);

    this.viewer_.on('change:center', this.boundUserInteractionStart_);
    this.viewer_.on('change:resolution', this.boundUserInteractionStart_);
    this.viewer_.on('map/change:size', this.userInteractionStart_);
    this.viewer_.on('map/moveend', this.boundUserInteractionEnd_);
  }

  // Cancel any pending extent updates.
  cancelPendingExtentUpdates_ () {
    if (this.extentUpdateTimer_ !== null) {
      window.clearTimeout(this.extentUpdateTimer_);
      this.extentUpdateTimer_ = null;
    }
  }

  /**
   * Start or restart the app with the given hash string.
   * @param {String} hash
   */
  startWithHash (hash) {
    if (this.busy_) {
      warn('Hash update while busy!');
      location.reload();
      return;
    }
    this.busy_ = true;

    // Cancel any extent updates.
    this.cancelPendingExtentUpdates_();

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
    if (this.loaded_ && sourceUrl === this.loadedSourceUrl_) {
      // Source Url didn't change.
      log('Updating...');
      // Update layers.
      this.viewer_.updateLayers(mainLayerCollection, extra.layerConfigs);
      // Update map view extent.
      const newExtent = (extra.extent !== null) ? extra.extent : this.loadedSourceData_.extent;
      if (!isIdenticalExtent(this.fitExtent_, newExtent)) {
        map.getView().fit(newExtent, map.getSize());
        this.fitExtent_ = map.getView().calculateExtent(map.getSize());
      }

      layerListControl.update(extra.layerConfigs);

      log('Updated');
      this.busy_ = false;
    } else {
      log('Loading new...');
      // Some resetting here.
      this.loaded_ = false;
      this.loadedSourceUrl_ = null;
      this.loadedSourceData_ = null;
      this.fitExtent_ = null;
      mainLayerCollection.clear();
      this.$notificationContainer_.empty();
      layerListControl.reload([], {});
      this.viewer_.setMapProjection(null);

      this.$notificationContainer_.append(
        $('<div class="hashparse">')
        .append($('<div>').text(`source: ${parse.source}`))
        .append($('<div>').text(`config: ${JSON.stringify(extra.layerConfigs)}`))
        .append($('<div>').text(`extent: ${JSON.stringify(extra.extent)}`))
      );
      // Source Url is necessary.
      if (sourceUrl.length === 0) {
        // No source url available.
        warn('No source url available.');
        this.$notificationContainer_.append($('<span>').text('No source url available.'));
        return;
      }
      log('Downloading source file...');
      this.$notificationContainer_.append($('<span>').text('Downloading source file...'));
      $.getJSON(sourceUrl)
      .fail((jqxhr, textStatus, err) => {
        const errStr = `${textStatus}, ${err}`;
        error(errStr);
        this.$notificationContainer_.append($('<span>').text(errStr));
      })
      .done((data) => {
        info('Downloaded', data);
        this.$notificationContainer_.empty();
        try {
          // Load projection from source file or use default.
          this.viewer_.setMapProjection(data.projection || DefaultProjection);
          // Load layers.
          this.viewer_.loadLayers(mainLayerCollection, data.layers);
          // Update layers.
          this.viewer_.updateLayers(mainLayerCollection, extra.layerConfigs);
          // Update map view extent.
          const newExtent = (extra.extent !== null) ? extra.extent : data.extent;
          map.getView().fit(newExtent, map.getSize());
          this.fitExtent_ = map.getView().calculateExtent(map.getSize());

          layerListControl.reload(data.layers, extra.layerConfigs);

          this.loaded_ = true;
          this.loadedSourceUrl_ = sourceUrl;
          this.loadedSourceData_ = data;
          log('Loaded');
        } catch (err) {
          error(err);
          this.$notificationContainer_.append($('<span>').text(err));
        }
        this.busy_ = false;
      });
    }
  }

  /**
   * Handler for the start of a user interaction on the map.
   */
  userInteractionStart_ () {
    this.cancelPendingExtentUpdates_();
  }

  /**
   * Handler for the end of a user interaction on the map.
   */
  userInteractionEnd_ () {
    // If not loaded, ignore these events.
    if (!this.loaded_) {
      return;
    }

    this.cancelPendingExtentUpdates_();

    const viewExtent = map.getView().calculateExtent(map.getSize());

    // Check if need to update extent.
    if (isIdenticalExtent(this.fitExtent_, viewExtent)) {
      return;
    }

    this.fitExtent_ = viewExtent;

    this.extentUpdateTimer_ = window.setTimeout(this.setHashViewExtent.bind(this, viewExtent), extentUpdateDelay);
  }

  /**
   * Set the view extent in url hash.
   * Updates the url hash when needed.
   * @param {Array.<Number>} extent
   */
  setHashViewExtent (extent) {
    this.extentUpdateTimer_ = null;

    // If not loaded, do nothing.
    if (!this.loaded_) {
      return;
    }

    // Update Hash.
    const extentString = buildExtentString(extent);
    setHashValue({
      "extent": extentString
    });
  }
}

const app = new App({
  mapContainerSelector: '#map',
  notificationContainerSelector: '#notifications'
});

$(window).on('load', () => {
  app.startWithHash(location.hash);
  $(window).on('hashchange', () => {
    // Need to check if Source Url has been changed.
    app.startWithHash(location.hash);
  });
});

window.__app = app;
