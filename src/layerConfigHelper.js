import {
  UrlSymbals
} from './config.js';

/**
 * Check if the given value is a non-empty string containing a numeric value.
 * @param {*} value
 * @returns {Boolean}
 */
const isValidConfigValue = (value) => {
  return typeof value === 'string' && value.length > 0 && !isNaN(value);
};

/**
 * Parse the given config string and return a map of layer ID to config object pairs.
 * @param {String} configString
 * @returns {Object.<String, {zIndex: Number, visible: Boolean, opacity: Number}>}
 */
export const parseLayerConfigString = (configString) => {
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
 * Build a config string from an array of config objects.
 * @param {Array.<{id: String, zIndex: Number, visible: Boolean, opacity: Number}>} layerConfigs
 * @returns {String}
 */
export const buildLayerConfigString = (layerConfigs) => {
  const segments = [];
  // Make a copy.
  const localConfigs = layerConfigs.slice(0);
  // Sort by layerId.
  localConfigs.sort((a, b) => a.id < b.id ? -1 : 1);

  for (let config of localConfigs) {
    segments.push(`${config.id}${UrlSymbals.Colon}${config.zIndex}${UrlSymbals.Comma}${Number(config.visible)}${UrlSymbals.Comma}${config.opacity}`);
  }

  return segments.join(UrlSymbals.SemiColon);
};

export default {
  buildLayerConfigString,
  parseLayerConfigString
};
