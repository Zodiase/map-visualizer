import {
  maxOpacity,
  minOpacity
} from './config.js';

import {
  warn
} from './generalHelpers.js';

import {
  setHashValue
} from './locationHashHelper.js';

import {
  buildLayerConfigString
} from './layerConfigHelper.js';

// Layer List Control constructor.
export const LayerListControl = function (opt_options) {
  // Unable to get the map here.

  const options = opt_options || {};

  // Internal data structure storing layers.
  // @type {Array.<Object>}
  this.layers_ = [];
  // @type {Object.<String, Object>}
  this.layersIndex_ = {};

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

  this.boundPromoteLayerHandler_ = this.promoteLayerHandler_.bind(this);
  $(this.layerListBody_).on('click', `.${this.CssClasses_.ItemAction_Promote}`, this.boundPromoteLayerHandler_);
  $(this.layerListBody_).on('touchstart', `.${this.CssClasses_.ItemAction_Promote}`, this.boundPromoteLayerHandler_);

  this.boundDemoteLayerHandler_ = this.demoteLayerHandler_.bind(this);
  $(this.layerListBody_).on('click', `.${this.CssClasses_.ItemAction_Demote}`, this.boundDemoteLayerHandler_);
  $(this.layerListBody_).on('touchstart', `.${this.CssClasses_.ItemAction_Demote}`, this.boundDemoteLayerHandler_);

  this.boundToggleOpacityControlHandler_ = this.toggleOpacityControlHandler_.bind(this);
  $(this.layerListBody_).on('click', `.${this.CssClasses_.ItemAction_Opacity}`, this.boundToggleOpacityControlHandler_);
  $(this.layerListBody_).on('touchstart', `.${this.CssClasses_.ItemAction_Opacity}`, this.boundToggleOpacityControlHandler_);

  this.boundChangeLayerOpacityHandler_ = this.changeLayerOpacityHandler_.bind(this);
  $(this.layerListBody_).on('input', `.${this.CssClasses_.ItemRow}.row-opacity .${this.CssClasses_.ItemRow}__input`, this.boundChangeLayerOpacityHandler_);

  this.boundToggleLayerListHandler_ = this.toggleLayerListHandler_.bind(this);
  this.toggleButton_.addEventListener('click', this.boundToggleLayerListHandler_, false);
  this.toggleButton_.addEventListener('touchstart', this.boundToggleLayerListHandler_, false);

  this.element_ = document.createElement('div');
  this.element_.className = 'layer-list ol-unselectable';
  this.element_.appendChild(this.layerListContainer_);
  this.element_.appendChild(this.toggleButtonWrapper_);

  /**
   * @private
   * @type {ol.Map}
   */
  this.map_ = null;

  // Create bound handlers.
  this.boundLayerChangeHandler_ = this.layerChangeHandler_.bind(this);

  ol.control.Control.call(this, {
    element: this.element_,
    target: options.target
  });
};
ol.inherits(LayerListControl, ol.control.Control);

LayerListControl.prototype.setMap = function (map) {
  if (this.map_) {
    this.map_.getLayerGroup().un('change:layers', this.boundLayerChangeHandler_);
  }

  ol.control.Control.prototype.setMap.call(this, map);

  if (map) {
    this.map_ = map;
    this.map_.getLayerGroup().on('change:layers', this.boundLayerChangeHandler_);
  }
};

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
 * Handler for map layer changes.
 * Reloads the layer list.
 */
LayerListControl.prototype.layerChangeHandler_ = function () {
  this.reload_();
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
LayerListControl.prototype.compareLayerOrder_ = (a, b) => (a.zIndex === b.zIndex) ? (b.index - a.index) : (b.zIndex - a.zIndex);

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
  const viewportElement = this.getMap().getViewport();
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
  const button = event.currentTarget;
  const rowElement = button.parentElement;
  const layerElement = rowElement.parentElement;
  const layerId = layerElement.getAttribute('data-layer-id');
  const layer = this.layersIndex_[layerId];
  layer.visible = !layer.visible;

  // Update hash.
  const configString = buildLayerConfigString(this.layers_);

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
  const button = event.currentTarget;
  const rowElement = button.parentElement;
  const layerElement = rowElement.parentElement;
  const layerId = layerElement.getAttribute('data-layer-id');
  const thisLayer = this.layersIndex_[layerId];
  const layerIndex = this.layers_.indexOf(thisLayer);

  // Range check.
  if (layerIndex < 0 || layerIndex >= this.layers_.length) {
    throw new RangeError('Unexpected layer index.');
  }
  if (layerIndex === 0) {
    warn('Can not promote top most layer.');
    return;
  }

  // Update zIndex of layers with their index in list (since the list is sorted).
  this.reIndex_();

  // Swap zIndex between this layer and its upper layer (if present).
  const upperLayer = this.layers_[layerIndex - 1];
  // Since the updated zIndex values are continuous, swapping could be done this way.
  upperLayer.zIndex--;
  thisLayer.zIndex++;

  // Update hash.
  const configString = buildLayerConfigString(this.layers_);

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
  const button = event.currentTarget;
  const rowElement = button.parentElement;
  const layerElement = rowElement.parentElement;
  const layerId = layerElement.getAttribute('data-layer-id');
  const thisLayer = this.layersIndex_[layerId];
  const layerIndex = this.layers_.indexOf(thisLayer);

  // Range check.
  if (layerIndex < 0 || layerIndex >= this.layers_.length) {
    throw new RangeError('Unexpected layer index.');
  }
  if (layerIndex === this.layers_.length - 1) {
    warn('Can not demote bottom most layer.');
    return;
  }

  // Update zIndex of layers with their index in list (since the list is sorted).
  this.reIndex_();

  // Swap zIndex between this layer and its lower layer (if present).
  const lowerLayer = this.layers_[layerIndex + 1];
  // Since the updated zIndex values are continuous, swapping could be done this way.
  lowerLayer.zIndex++;
  thisLayer.zIndex--;

  // Update hash.
  const configString = buildLayerConfigString(this.layers_);

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
  const button = event.currentTarget;
  const rowElement = button.parentElement;
  const layerElement = rowElement.parentElement;
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
  const input = event.currentTarget;
  const rowElement = input.parentElement;
  const valueLabel = rowElement.querySelector(`.${this.CssClasses_.ItemRow}__value-label`);
  const layerElement = rowElement.parentElement;
  const opacityToggle = layerElement.querySelector(`.${this.CssClasses_.ItemAction_Opacity}`);
  const layerId = layerElement.getAttribute('data-layer-id');
  const thisLayer = this.layersIndex_[layerId];
  // @range [1, 100]
  const inputValue = input.value;
  const opacityValue = inputValue * 0.01;

  valueLabel.textContent = `${inputValue}%`;
  thisLayer.opacity = opacityValue;
  opacityToggle.style.opacity = opacityValue;

  if (typeof event.detail === 'object' && event.detail.noUpdate) {
    // Don't update hash.
  } else {
    // Update hash.
    const configString = buildLayerConfigString(this.layers_);
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
  this.layers_.forEach((layer, index, layers) => {
    layer.zIndex = (layers.length - 1) - index;
  });
};

/**
 * Creates an element representing a layer.
 * @param {Object} layer
 * @returns {HTMLElement}
 */
LayerListControl.prototype.createLayerItemRowElement_ = function (layerAbstract) {
  const itemHideToggle = document.createElement('button');
  itemHideToggle.className = `${this.CssClasses_.ItemAction_Hide} material-icons`;
  itemHideToggle.title = 'Toggle layer visibility';
  itemHideToggle.textContent = 'visibility_off';

  const itemLabel = document.createElement('label');
  itemLabel.className = `${this.CssClasses_.Item}__label`;
  itemLabel.textContent = layerAbstract.title;

  const itemPromote = document.createElement('button');
  itemPromote.className = `${this.CssClasses_.ItemAction_Promote} material-icons`;
  itemPromote.title = 'Bring layer forward';
  itemPromote.textContent = 'keyboard_arrow_up';
  const itemDemote = document.createElement('button');
  itemDemote.className = `${this.CssClasses_.ItemAction_Demote} material-icons`;
  itemDemote.title = 'Send layer backward';
  itemDemote.textContent = 'keyboard_arrow_down';

  const itemOpacityToggle = document.createElement('button');
  itemOpacityToggle.className = `${this.CssClasses_.ItemAction_Opacity} material-icons`;
  itemOpacityToggle.title = 'Toggle opacity slider';
  itemOpacityToggle.textContent = 'opacity';
  itemOpacityToggle.style.opacity = layerAbstract.opacity;

  const itemRowMain = document.createElement('div');
  itemRowMain.className = this.CssClasses_.ItemRow;
  itemRowMain.appendChild(itemHideToggle);
  itemRowMain.appendChild(itemLabel);
  itemRowMain.appendChild(itemDemote);
  itemRowMain.appendChild(itemPromote);
  itemRowMain.appendChild(itemOpacityToggle);

  const itemRowOpacityLabel = document.createElement('label');
  itemRowOpacityLabel.className = `${this.CssClasses_.ItemRow}__label`;
  itemRowOpacityLabel.textContent = 'Opacity';

  const itemRowOpacityInput = document.createElement('input');
  itemRowOpacityInput.className = `${this.CssClasses_.ItemRow}__input`;
  itemRowOpacityInput.type = 'range';
  itemRowOpacityInput.max = maxOpacity * 100;
  itemRowOpacityInput.min = minOpacity * 100;
  itemRowOpacityInput.step = 5;
  itemRowOpacityInput.value = Math.floor(layerAbstract.opacity * 100);

  const itemRowOpacityValueLabel = document.createElement('label');
  itemRowOpacityValueLabel.className = `${this.CssClasses_.ItemRow}__value-label`;
  itemRowOpacityValueLabel.textContent = `${itemRowOpacityInput.value}%`;

  const itemRowOpacity = document.createElement('div');
  itemRowOpacity.className = `${this.CssClasses_.ItemRow} row-opacity`;
  itemRowOpacity.appendChild(itemRowOpacityLabel);
  itemRowOpacity.appendChild(itemRowOpacityInput);
  itemRowOpacity.appendChild(itemRowOpacityValueLabel);

  const itemContainer = document.createElement('div');
  itemContainer.className = this.CssClasses_.Item;
  if (!layerAbstract.visible) {
    itemContainer.classList.add(this.CssClasses_.Item_Hidden);
  } else {
    itemContainer.classList.remove(this.CssClasses_.Item_Hidden);
  }
  itemContainer.setAttribute('data-layer-id', layerAbstract.id);
  itemContainer.appendChild(itemRowMain);
  itemContainer.appendChild(itemRowOpacity);

  return itemContainer;
};

/**
 * Reload everything in the list from the map layers.
 */
LayerListControl.prototype.reload_ = function () {
  const layerCollection = this.map_.getLayerGroup().getLayers(),
        container = this.layerListBody_;

  // Reset.
  while (container.lastChild) {
    container.removeChild(container.lastChild);
  }
  this.layers_.length = 0;
  for (let key of Object.keys(this.layersIndex_)) {
    delete this.layersIndex_[key];
  }

  layerCollection.forEach((layer, index) => {
    const layerId = layer.get('id');

    const layerAbstract = {
      "index": index,
      "id": layerId,
      "title": layer.get('title'),
      "zIndex": layer.get('zIndex'),
      "visible": layer.get('visible'),
      "opacity": layer.get('opacity')
    };

    this.layers_.push(layerAbstract);
    this.layersIndex_[layerId] = layerAbstract;
  });

  this.sortLayers_();

  // Build DOM.
  this.layers_.forEach((layerAbstract) => {
    container.appendChild(this.createLayerItemRowElement_(layerAbstract));
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

  // Get a layer-index mapping in order to detect changes in order.
  const orderMap = {};
  this.layers_.forEach((layer, index) => {
    orderMap[layer.id] = index;
  });

  this.sortLayers_();

  // Check if the order is changed.
  let orderChanged = false;
  this.layers_.forEach((layer, index) => {
    if (orderMap[layer.id] !== index) {
      orderChanged = true;
    }
  });

  // Update DOM.
  const $listItems = $(container).children(`.${this.CssClasses_.Item}`);
  // Only re-order the list elements when necessary.
  if (orderChanged) {
    $(container).append(
        $listItems.detach().sort((a, b) => {
          const layerIdA = a.getAttribute('data-layer-id'),
                layerIdB = b.getAttribute('data-layer-id');
          const layerA = this.layersIndex_[layerIdA],
                layerB = this.layersIndex_[layerIdB];
          return this.compareLayerOrder_(layerA, layerB);
        })
    );
  }
  // Update each item.
  const this_ = this;
  $listItems.each(function () {
    // `this` is the element.
    const layerRowElement = this;

    const layerId = layerRowElement.getAttribute('data-layer-id');
    const layer = this_.layersIndex_[layerId];

    if (!layer.visible) {
      layerRowElement.classList.add(this_.CssClasses_.Item_Hidden);
    } else {
      layerRowElement.classList.remove(this_.CssClasses_.Item_Hidden);
    }

    const opacityRow = layerRowElement.querySelector(`.${this_.CssClasses_.ItemRow}.row-opacity`);
    const opacityInput = opacityRow.querySelector(`.${this_.CssClasses_.ItemRow}__input`);
    const opacityInputValue = Math.floor(layer.opacity * 100);
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

export default {
  LayerListControl
};
