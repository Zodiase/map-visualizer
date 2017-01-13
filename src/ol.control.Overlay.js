/*global document*/

import $ from 'jquery';

// Layer List Control constructor.
export const OverlayControl = function (opt_options) {
  const options = opt_options || {};

  this.element_ = document.createElement('div');
  this.element_.className = 'overlay ol-unselectable';

  this.$element_ = $(this.element_);

  ol.control.Control.call(this, {
    element: this.element_,
    target: options.target
  });
};
ol.inherits(OverlayControl, ol.control.Control);

// Mirror jQuery Element methods.
['append', 'empty'].forEach((propName) => {
  OverlayControl.prototype[propName] = function (...args) {
    return this.$element_[propName](...args);
  };
});

// Shortcuts.
OverlayControl.prototype.appendText = function (str) {
  return this.$element_.append($('<span>').text(str));
};
