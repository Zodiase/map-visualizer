/*global location*/

/**
 * Parse a location hash string and return key-value pairs.
 * The input hash string can optionally have a leading `#`.
 * @param {String} hash
 * @returns {Object}
 */
export const parseHashString = (hash) => {
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
 * Build a location hash string from the given key-value pairs.
 * Note that the hash string doesn't have la leading `#`.
 * @param {Object} map
 * @returns {String}
 */
export const buildHashString = (map) => {
  let segments = [];
  for (let key of Object.keys(map)) {
    segments.push(`${encodeURIComponent(key)}=${encodeURIComponent(map[key])}`);
  }
  return segments.join('&');
};

/**
 * Apply the given key-value pairs to the current location hash.
 * @param {Object} map
 */
export const setHashValue = (map) => {
  const parse = parseHashString(location.hash);
  for (let key of Object.keys(map)) {
    parse[key] = map[key];
  }
  const hash = buildHashString(parse);
  location.hash = hash;
};

export default {
  buildHashString,
  parseHashString,
  setHashValue
};
