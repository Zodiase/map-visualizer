import {
  UrlSymbals
} from './config.js';

/**
 * @param {String} extentString
 * @returns {Array.<Number>}
 */
export const parseExtentString = (extentString) => {
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
export const buildExtentString = (extent) => {
  const segments = extent.slice(0, 4);
  return (segments.length === 4) ? segments.join(UrlSymbals.Comma) : '';
};

/**
 * @param {Array.<Number>} a
 * @param {Array.<Number>} b
 * @returns {Boolean}
 */
export const isIdenticalExtent = (a, b) => {
  for (let i = 0; i < 4; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

export default {
  isIdenticalExtent,
  buildExtentString,
  parseExtentString
};
