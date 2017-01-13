/*global window*/

import $ from 'jquery';
import _ from 'lodash';

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

import {
  OverlayControl
} from './ol.control.Overlay.js';

class App {
  /**
   * @param {string} options.mapContainerSelector
   */
  constructor ({mapContainerSelector}) {
    const mapContainer = $(mapContainerSelector)[0];
    if (!mapContainer) {
      throw new ReferenceError('Can not find map container.');
    }

    this.overlay_ = new OverlayControl();

    this.viewer_ = new Viewer({
      target: mapContainer,
      controls: [
        this.overlay_
      ]
    });

    // # Runtime data.
    this.state_ = new Map();

    /**
     * If true, the app is busy processing a hash change.
     * @type {Boolean}
     */
    this.state_.set('busy', false);

    /**
     * If true, the app has successfully loaded a valid source file.
     * @type {Boolean}
     */
    this.state_.set('sourceLoaded', false);

    /**
     * If a valid source file has been loaded, this is the url of the loaded source file.
     * @type {String|null}
     */
    this.state_.set('loadedSourceUrl', null);

    /**
     * If a valid source file has been loaded, this is the data of the loaded source file.
     * @type {Object|null}
     */
    this.state_.set('loadedSourceData', null);

    /**
     * Stores the last fitted stable map view extent.
     * @type {Array.<Number>|null}
     */
    this.fitExtent_ = null;

    this.boundUserInteractionStart_ = this.userInteractionStart_.bind(this);
    this.boundUserInteractionEnd_ = this.userInteractionEnd_.bind(this);
    this.boundSetHashViewExtent_ = this.setHashViewExtent.bind(this);

    this.debouncedSetHashViewExtent_ = _.debounce(this.boundSetHashViewExtent_, extentUpdateDelay);

    this.viewer_.on('change:center', this.boundUserInteractionStart_);
    this.viewer_.on('change:resolution', this.boundUserInteractionStart_);
    this.viewer_.on('map/change:size', this.boundUserInteractionStart_);
    this.viewer_.on('map/moveend', this.boundUserInteractionEnd_);
  }

  // Cancel any pending extent updates.
  cancelPendingExtentUpdates_ () {
    this.debouncedSetHashViewExtent_.cancel();
  }

  /**
   * Start or restart the app with the given hash string.
   * @param {String} hash
   */
  startWithHash (hash) {
    // The app should not handle a new hash while busy.
    if (this.state_.get('busy')) {
      warn('Hash update while busy!');
      window.location.reload();
      return;
    }
    this.state_.set('busy', true);

    // Cancel any extent updates.
    this.cancelPendingExtentUpdates_();

    info('Hash', hash);

    const parse = parseHashString(hash);
    info('parse', parse);

    const sourceUrl = (parse.source || '').trim();
    info('sourceUrl', sourceUrl);

    // Config String and Extent String are optional.
    const configString = (parse.config || '').trim(),
          extentString = (parse.extent || '').trim();

    const extra = {
      layerConfigs: parseLayerConfigString(configString),
      extent: parseExtentString(extentString)
    };
    info('extra.layerConfigs', extra.layerConfigs);
    info('extra.extent', extra.extent);

    if (this.state_.get('sourceLoaded') && sourceUrl === this.state_.get('loadedSourceUrl')) {
      // Source Url didn't change.

      log('Updating...');

      // Update layers.
      this.viewer_.updateLayers(extra.layerConfigs);

      // Update map view extent.
      const newExtent = (extra.extent !== null) ? extra.extent : this.state_.get('loadedSourceData').extent;
      if (!isIdenticalExtent(this.fitExtent_, newExtent)) {
        this.fitExtent_ = this.viewer_.setExtent(newExtent);
      }

      log('Updated');

      this.state_.set('busy', false);

    } else {
      // Start with new source.

      log('Loading new...');

      // Reset loading state.
      this.state_.set('sourceLoaded', false);
      this.state_.set('loadedSourceUrl', null);
      this.state_.set('loadedSourceData', null);

      // Reset viewer.
      this.viewer_.setLayers([]);
      this.viewer_.setMapProjection(null);

      // Reset other app stuff.
      this.fitExtent_ = null;
      this.overlay_.empty();

      this.overlay_.append(
        $('<div class="hashparse">')
        .append($('<div>').text(`source: ${parse.source}`))
        .append($('<div>').text(`config: ${JSON.stringify(extra.layerConfigs)}`))
        .append($('<div>').text(`extent: ${JSON.stringify(extra.extent)}`))
      );

      // Source Url is required.
      if (sourceUrl.length === 0) {
        // No source url available.
        warn('No source url available.');
        this.overlay_.appendText('No source url available.');
        return;
      }

      log('Downloading source file...');
      this.overlay_.appendText('Downloading source file...');

      //! Emit `source-before-download`, along with `sourceUrl`.

      $.getJSON(sourceUrl)
      .fail((jqxhr, textStatus, err) => {
        const errStr = `${textStatus}, ${err}`;
        error(errStr);
        this.overlay_.appendText(errStr);
      })
      .done((data) => {
        info('Downloaded', data);

        // Clear overlay info to clear the view of the map.
        this.overlay_.empty();

        try {
          // Load projection from source file or use default.
          this.viewer_.setMapProjection(data.projection || DefaultProjection);
          // Update map view extent.
          const newExtent = (extra.extent !== null) ? extra.extent : data.extent;
          this.fitExtent_ = this.viewer_.setExtent(newExtent);
          // Load layers.
          this.viewer_.setLayers(data.layers, extra.layerConfigs);

          this.state_.set('sourceLoaded', true);
          this.state_.set('loadedSourceUrl', sourceUrl);
          this.state_.set('loadedSourceData', data);

          log('Loaded');
        } catch (err) {
          error(err);
          this.overlay_.appendText(err);
        }

        this.state_.set('busy', false);
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
    if (!this.state_.get('sourceLoaded')) {
      return;
    }

    const viewExtent = this.viewer_.getExtent();

    // Check if need to update extent.
    if (isIdenticalExtent(this.fitExtent_, viewExtent)) {
      return;
    }

    this.fitExtent_ = viewExtent;

    this.debouncedSetHashViewExtent_(viewExtent);
  }

  /**
   * Set the view extent in url hash.
   * Updates the url hash when needed.
   * @param {Array.<Number>} extent
   */
  setHashViewExtent (extent) {
    // If not loaded, do nothing.
    if (!this.state_.get('sourceLoaded')) {
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
  mapContainerSelector: '#map'
});

$(window).on('load', () => {
  app.startWithHash(window.location.hash);
  $(window).on('hashchange', () => {
    // Need to check if Source Url has been changed.
    app.startWithHash(window.location.hash);
  });
});

window.__app = app;
