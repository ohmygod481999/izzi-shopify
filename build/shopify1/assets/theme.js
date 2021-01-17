/*
* This is an unminified version of the theme.min.js file used by your theme.
* If you want to use this file, you will need to change the script reference in your theme
* Change <script src="{{ 'theme.min.js' | asset_url }}"> to:
* <script src="{{ 'theme.js' | asset_url }}">
*/
(function (sections,_shopify_themeA11y) {
sections = 'default' in sections ? sections['default'] : sections;

const keyCodes = {
  TAB: 'tab',
  ENTER: 'enter',
  ESC: 'escape',
  SPACE: ' ',
  END: 'end',
  HOME: 'home',
  LEFT: 'arrowleft',
  UP: 'arrowup',
  RIGHT: 'arrowright',
  DOWN: 'arrowdown',
};

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    // eslint-disable-next-line babel/no-invalid-this
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/* eslint-disable babel/no-invalid-this */
function promiseStylesheet(stylesheet) {
  const stylesheetUrl = stylesheet || theme.stylesheet;

  if (typeof this.stylesheetPromise === 'undefined') {
    this.stylesheetPromise = new Promise((resolve) => {
      const link = document.querySelector(`link[href="${stylesheetUrl}"]`);

      if (link.loaded) {
        resolve();
      }

      window.onloadCSS(link, function () {
        // Global onloadCSS function injected by load-css.liquid
        resolve();
      });
    });
  }

  return this.stylesheetPromise;
}
/* eslint-enable babel/no-invalid-this */

function promiseTransitionEnd(element) {
  const events = [
    'webkitTransitionEnd',
    'otransitionend',
    'oTransitionEnd',
    'msTransitionEnd',
    'transitionend',
  ];

  const properties = [
    'WebkitTransition',
    'MozTransition',
    'OTransition',
    'msTransition',
    'transition',
  ];

  let duration = 0;
  let promise = Promise.resolve();

  properties.forEach(() => {
    /* eslint-disable-next-line */
    duration ||
      (duration = parseFloat(
        window.getComputedStyle(element).transitionDuration
      ));
  });

  if (duration > 0) {
    promise = new Promise((resolve) => {
      const handlers = events.map((event) => {
        element.addEventListener(event, handler);
        return {
          event,
          handler,
        };
      });

      function handler(event) {
        if (event.target !== element) return;

        // eslint-disable-next-line no-shadow
        handlers.forEach(({ event, handler }) => {
          element.removeEventListener(event, handler);
        });

        resolve();
      }
    });
  }

  return promise;
}

function cookiesEnabled() {
  let cookieEnabled = window.navigator.cookieEnabled;

  if (!cookieEnabled) {
    document.cookie = 'testcookie';
    cookieEnabled = document.cookie.indexOf('testcookie') !== -1;
  }
  return cookieEnabled;
}

function resizeSelectInput(selectInput) {
  const arrowWidth = 50;

  const test = document.createElement('span');
  test.innerHTML = selectInput.selectedOptions[0].label;

  document.querySelector('.footer').appendChild(test);

  const width = test.offsetWidth;
  test.remove();

  selectInput.style.width = `${width + arrowWidth}px`;
}

function getMediaQueryString(width, limit = 'min') {
  const mediaQueries = {
    medium: '46.85em',
    large: '61.85em',
    widescreen: '87.5em',
  };

  return `(${limit}-width: ${mediaQueries[width]})`;
}

const selectors = {
  stage: 'data-popup-stage',
  popup: 'data-popup',
  open: 'data-popup-open',
  close: 'data-popup-close',
  focus: 'data-popup-focus',
};

const classes = {
  open: 'is-open',
  transitionReady: 'transition-ready',
  preventScrolling: 'prevent-scrolling',
};

class Popup {
  constructor(popup) {
    this.name = popup;
  }

  init() {
    this.elements = this._getElements();
    this._bindEvents();
    this.keyUpHandler = this._onKeyUp.bind(this);
    this.scrollPosition = window.pageYOffset;
  }

  openPopup(event) {
    if (event.preventDefault) event.preventDefault();
    this._prepareAnimation();
    this.elements.stage.classList.add(classes.open);
    this._sleepAnimation();

    if (this.elements.focus) {
      _shopify_themeA11y.trapFocus(this.elements.popup, { elementToFocus: this.elements.focus });
    } else {
      _shopify_themeA11y.trapFocus(this.elements.popup);
    }

    this.elements.triggerNode = event.currentTarget;
    this.elements.triggerNode.setAttribute('aria-expanded', true);
    this._enableScrollLock();

    document.addEventListener('keyup', this.keyUpHandler);
  }

  closePopup(removeFocus = true) {
    this._prepareAnimation();
    this.elements.stage.classList.remove(classes.open);
    this._sleepAnimation();

    if (removeFocus) {
      _shopify_themeA11y.removeTrapFocus();
      this.elements.triggerNode.focus();
      document.removeEventListener('keyup', this.keyUpHandler);
    }

    this.elements.triggerNode.setAttribute('aria-expanded', false);
    this._disableScrollLock();

    this.elements.triggerNode.dispatchEvent(
      new window.CustomEvent('popup_closed')
    );
  }

  getElements() {
    return this.elements;
  }

  _prepareAnimation() {
    this.elements.stage.classList.add(classes.transitionReady);
  }

  _sleepAnimation() {
    return promiseTransitionEnd(this.elements.popup).then(() => {
      this.elements.stage.classList.remove(classes.transitionReady);
    });
  }

  _getElements() {
    return {
      stage: document.querySelector(`[${selectors.stage}=${this.name}]`),
      popup: document.querySelector(`[${selectors.popup}=${this.name}]`),
      open: document.querySelectorAll(`[${selectors.open}=${this.name}]`),
      close: document.querySelectorAll(`[${selectors.close}=${this.name}]`),
      focus: document.querySelector(`[${selectors.focus}=${this.name}]`),
    };
  }

  _bindEvents() {
    this.elements.open.forEach((openButton) => {
      openButton.addEventListener('click', (event) => this.openPopup(event));
    });

    this.elements.close.forEach((closeButton) => {
      closeButton.addEventListener('click', () => this.closePopup());
    });
  }

  _enableScrollLock() {
    this.scrollPosition = window.pageYOffset;
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.classList.add(classes.preventScrolling);
  }

  _disableScrollLock() {
    document.body.classList.remove(classes.preventScrolling);
    document.body.style.removeProperty('top');
    window.scrollTo(0, this.scrollPosition);
  }

  _onKeyUp(event) {
    if (event.key.toLowerCase() === keyCodes.ESC) this.closePopup();
  }
}

function getDefaultRequestConfig() {
  return JSON.parse(
    JSON.stringify({
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json;'
      }
    })
  );
}

function fetchJSON(url, config) {
  return fetch(url, config).then(function(response) {
    if (!response.ok) {
      throw response;
    }
    return response.json();
  });
}

function cart() {
  return fetchJSON('/cart.js', getDefaultRequestConfig());
}



function cartAddFromForm(formData) {
  var config = getDefaultRequestConfig();
  delete config.headers['Content-Type'];

  config.method = 'POST';
  config.body = formData;

  return fetchJSON('/cart/add.js', config);
}

function cartChange(line, options) {
  var config = getDefaultRequestConfig();

  options = options || {};

  config.method = 'POST';
  config.body = JSON.stringify({
    line: line,
    quantity: options.quantity,
    properties: options.properties
  });

  return fetchJSON('/cart/change.js', config);
}



function cartUpdate(body) {
  var config = getDefaultRequestConfig();

  config.method = 'POST';
  config.body = JSON.stringify(body);

  return fetchJSON('/cart/update.js', config);
}

function key(key) {
  if (typeof key !== 'string' || key.split(':').length !== 2) {
    throw new TypeError(
      'Theme Cart: Provided key value is not a string with the format xxx:xxx'
    );
  }
}

function quantity(quantity) {
  if (typeof quantity !== 'number' || isNaN(quantity)) {
    throw new TypeError(
      'Theme Cart: An object which specifies a quantity or properties value is required'
    );
  }
}

function id(id) {
  if (typeof id !== 'number' || isNaN(id)) {
    throw new TypeError('Theme Cart: Variant ID must be a number');
  }
}

function properties(properties) {
  if (typeof properties !== 'object') {
    throw new TypeError('Theme Cart: Properties must be an object');
  }
}

function form(form) {
  if (!(form instanceof HTMLFormElement)) {
    throw new TypeError('Theme Cart: Form must be an instance of HTMLFormElement');
  }
}

function options(options) {
  if (typeof options !== 'object') {
    throw new TypeError('Theme Cart: Options must be an object');
  }

  if (
    typeof options.quantity === 'undefined' &&
    typeof options.properties === 'undefined'
  ) {
    throw new Error(
      'Theme Cart: You muse define a value for quantity or properties'
    );
  }

  if (typeof options.quantity !== 'undefined') {
    quantity(options.quantity);
  }

  if (typeof options.properties !== 'undefined') {
    properties(options.properties);
  }
}

/**
 * Cart Template Script
 * ------------------------------------------------------------------------------
 * A file that contains scripts highly couple code to the Cart template.
 *
 * @namespace cart
 */

/**
 * Returns the state object of the cart
 * @returns {Promise} Resolves with the state object of the cart (https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#get-cart)
 */
function getState() {
  return cart();
}

/**
 * Returns the index of the cart line item
 * @param {string} key The unique key of the line item
 * @returns {Promise} Resolves with the index number of the line item
 */
function getItemIndex(key$$1) {
  key(key$$1);

  return cart().then(function(state) {
    var index = -1;

    state.items.forEach(function(item, i) {
      index = item.key === key$$1 ? i + 1 : index;
    });

    if (index === -1) {
      return Promise.reject(
        new Error('Theme Cart: Unable to match line item with provided key')
      );
    }

    return index;
  });
}

/**
 * Fetches the line item object
 * @param {string} key The unique key of the line item
 * @returns {Promise} Resolves with the line item object (See response of cart/add.js https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#add-to-cart)
 */


/**
 * Add a new line item to the cart
 * @param {number} id The variant's unique ID
 * @param {object} options Optional values to pass to /cart/add.js
 * @param {number} options.quantity The quantity of items to be added to the cart
 * @param {object} options.properties Line item property key/values (https://help.shopify.com/en/themes/liquid/objects/line_item#line_item-properties)
 * @returns {Promise} Resolves with the line item object (See response of cart/add.js https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#add-to-cart)
 */


/**
 * Add a new line item to the cart from a product form
 * @param {object} form DOM element which is equal to the <form> node
 * @returns {Promise} Resolves with the line item object (See response of cart/add.js https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#add-to-cart)
 */
function addItemFromForm(form$$1) {
  form(form$$1);

  var formData = new FormData(form$$1);
  id(parseInt(formData.get('id'), 10));

  return cartAddFromForm(formData);
}

/**
 * Changes the quantity and/or properties of an existing line item.
 * @param {string} key The unique key of the line item (https://help.shopify.com/en/themes/liquid/objects/line_item#line_item-key)
 * @param {object} options Optional values to pass to /cart/add.js
 * @param {number} options.quantity The quantity of items to be added to the cart
 * @param {object} options.properties Line item property key/values (https://help.shopify.com/en/themes/liquid/objects/line_item#line_item-properties)
 * @returns {Promise} Resolves with the state object of the cart (https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#get-cart)
 */
function updateItem(key$$1, options$$1) {
  key(key$$1);
  options(options$$1);

  return getItemIndex(key$$1).then(function(line) {
    return cartChange(line, options$$1);
  });
}

/**
 * Removes a line item from the cart
 * @param {string} key The unique key of the line item (https://help.shopify.com/en/themes/liquid/objects/line_item#line_item-key)
 * @returns {Promise} Resolves with the state object of the cart (https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#get-cart)
 */


/**
 * Sets all quantities of all line items in the cart to zero. This does not remove cart attributes nor the cart note.
 * @returns {Promise} Resolves with the state object of the cart (https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#get-cart)
 */


/**
 * Gets all cart attributes
 * @returns {Promise} Resolves with the cart attributes object
 */


/**
 * Sets all cart attributes
 * @returns {Promise} Resolves with the cart state object
 */


/**
 * Clears all cart attributes
 * @returns {Promise} Resolves with the cart state object
 */


/**
 * Gets cart note
 * @returns {Promise} Resolves with the cart note string
 */


/**
 * Sets cart note
 * @returns {Promise} Resolves with the cart state object
 */
function updateNote(note) {
  return cartUpdate({ note: note });
}

/**
 * Clears cart note
 * @returns {Promise} Resolves with the cart state object
 */
function clearNote() {
  return cartUpdate({ note: '' });
}

/**
 * Get estimated shipping rates.
 * @returns {Promise} Resolves with response of /cart/shipping_rates.json (https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#get-shipping-rates)
 */

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var currency_cjs = createCommonjsModule(function (module, exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatMoney = formatMoney;
/**
 * Currency Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help with currency formatting
 *
 * Current contents
 * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
 *
 */

var moneyFormat = '${{amount}}';

/**
 * Format money values based on your shop currency settings
 * @param  {Number|string} cents - value in cents or dollar amount e.g. 300 cents
 * or 3.00 dollars
 * @param  {String} format - shop money_format setting
 * @return {String} value - formatted value
 */
function formatMoney(cents, format) {
  if (typeof cents === 'string') {
    cents = cents.replace('.', '');
  }
  var value = '';
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = format || moneyFormat;

  function formatWithDelimiters(number) {
    var precision = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;
    var thousands = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ',';
    var decimal = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '.';

    if (isNaN(number) || number == null) {
      return 0;
    }

    number = (number / 100.0).toFixed(precision);

    var parts = number.split('.');
    var dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
    var centsAmount = parts[1] ? decimal + parts[1] : '';

    return dollarsAmount + centsAmount;
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
  }

  return formatString.replace(placeholderRegex, value);
}
});

var formatMoney = currency_cjs.formatMoney;

const selectors$1 = {
  cartItemsWrapper: '[data-cart-items]',
  cartItem: 'data-cart-item',
  quantityInput: '[data-cart-item-quantity]',
  remove: '[data-remove]',
  cartCountBubble: '[data-cart-count-bubble]',
  cartCount: '[data-cart-count]',
  cartNote: '[data-cart-note]',
  cartPrice: '[data-cart-price]',
  priceLiveRegion: '[data-price-live-region]',
  checkoutButton: '[data-checkout-button]',
  cartItemError: '[data-cart-item-error]',
  closeButton: '[data-cart-close]',
  emptyText: '[data-cart-empty-text]',
  discounts: '[data-discounts]',
};

const classes$1 = {
  hidden: 'hidden',
  isEmpty: 'is-empty',
  cookiesDisabled: 'cookies-disabled',
  hasError: 'has-error',
};

class Cart {
  constructor(cartElement) {
    this.elements = {
      cart: cartElement,
    };
  }

  init() {
    if (!cookiesEnabled()) {
      this.elements.cart.classList.add(classes$1.cookiesDisabled);
      return;
    }

    Object.assign(
      this.elements,
      this.getCartElements(),
      this.getItemElements()
    );

    this.bindContextOfThis();

    this.debouncedOnCartItemInput = debounce((event, lineItem) => {
      this.onCartItemInput(event, lineItem);
    }, 300);

    this.addCartEvents();
    this.addItemEvents();
  }

  bindContextOfThis() {
    this.onCartItemInput = this.onCartItemInput.bind(this);
    this.onCartItemClick = this.onCartItemClick.bind(this);
    this.updateCartNote = this.updateCartNote.bind(this);
  }

  getItemElements() {
    return {
      cartItems: this.elements.cart.querySelectorAll(`[${selectors$1.cartItem}]`),
    };
  }

  getCartElements() {
    return {
      cartNote: this.elements.cart.querySelector(selectors$1.cartNote),
    };
  }

  addItemEvents() {
    this.elements.cartItems.forEach((cartItem) => {
      cartItem.addEventListener('change', (event) => {
        this.debouncedOnCartItemInput(event, event.currentTarget);
      });
      cartItem.addEventListener('click', this.onCartItemClick);
    });
  }

  addCartEvents() {
    if (this.elements.cartNote) {
      this.elements.cartNote.addEventListener('input', this.updateCartNote);
    }
  }

  onCartItemInput(event, lineItem) {
    event.preventDefault();
    const quantityInput = lineItem.querySelector(selectors$1.quantityInput);

    if (event.target === quantityInput) {
      return this.updateQuantity(event, lineItem);
    }

    return false;
  }

  onCartItemClick(event) {
    const remove = event.currentTarget.querySelector(selectors$1.remove);

    if (event.target === remove) {
      event.preventDefault();
      event.target.disabled = true;
      this.removeItem(event);
    }
  }

  updateQuantity(event, lineItem) {
    const key = lineItem.dataset.cartItem;
    const productId = lineItem.dataset.cartItemProductId;
    const [variantId] = key.split(':');
    const quantityInput = event.target;
    const quantityInputValue = quantityInput.value || 1;

    const newQuantity = parseInt(quantityInputValue, 10);
    this.removeLineItemError(lineItem);

    return updateItem(key, { quantity: newQuantity })
      .then((state) => {
        this.renderCart(state, productId);

        if (!state.item_count) {
          this.renderEmptyCart();
          return false;
        }

        return this.renderCartItems(state);
      })
      .then((state) => {
        if (!state) return;

        const updatedItem = state.items.find((item) => item.key === key);

        const totalQuantity = state.items.reduce((total, currentItem) => {
          return currentItem.id === Number(variantId)
            ? total + currentItem.quantity
            : total;
        }, 0);

        const currentLineItem = this.elements.cart.querySelector(
          `[${selectors$1.cartItem}="${key}"]`
        );

        if (currentLineItem) {
          currentLineItem.querySelector(selectors$1.quantityInput).focus();
        }

        if (newQuantity <= totalQuantity) return;

        const lineItemError = currentLineItem.querySelector(
          selectors$1.cartItemError
        );

        this.updateLineItemError(lineItemError, updatedItem);
      });
  }

  updateCartNote() {
    const note = this.elements.cartNote.value;

    if (note) {
      updateNote(note);
      return;
    }

    clearNote();
  }

  removeItem(event) {
    const lineItem = event.currentTarget;
    const key = lineItem.dataset.cartItem;
    const productId = lineItem.dataset.cartItemProductId;

    return updateItem(key, { quantity: 0 }).then((state) => {
      this.renderCart(state, productId);

      if (!state.item_count) {
        this.renderEmptyCart();
        return;
      }

      this.renderCartItems();

      this.elements.closeButton =
        this.elements.closeButton ||
        this.elements.cart.querySelector(selectors$1.closeButton);

      this.elements.closeButton.focus();
    });
  }

  updateLineItemError(lineItemError, item) {
    let errorMessage = theme.strings.quantityError;

    errorMessage = errorMessage
      .replace('[quantity]', item.quantity)
      .replace('[title]', item.title);

    lineItemError.innerHTML = errorMessage;
    lineItemError.classList.add(classes$1.hasError);
  }

  removeLineItemError(lineItem) {
    const lineItemError = lineItem.querySelector(selectors$1.cartItemError);
    lineItemError.classList.remove(classes$1.hasError);
    lineItemError.textContent = '';
  }

  changeCheckoutButtonState(shouldDisable) {
    this.elements.checkoutButton =
      this.elements.checkoutButton ||
      this.elements.cart.querySelector(selectors$1.checkoutButton);

    this.elements.checkoutButton.disabled = shouldDisable;
  }

  onNewItemAdded(updatedItem) {
    this.renderCartItems();

    return getState().then((state) => {
      this.renderCart(state, updatedItem);
    });
  }

  renderCartItems(state) {
    return fetch(`${theme.rootUrl}?section_id=cart-items`)
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        this.elements.cartItemsWrapper =
          this.elements.cartItemsWrapper ||
          this.elements.cart.querySelector(selectors$1.cartItemsWrapper);

        this.elements.cartItemsWrapper.innerHTML = html;
        Object.assign(this.elements, this.getItemElements());
        this.addItemEvents();
        return state;
      });
  }

  renderCart(state, updatedItem) {
    this.renderSubtotalPrice(state.total_price);
    this.renderCartCountBubble(state.item_count);
    this.renderPriceLiveRegion(state);
    this.renderCartLevelDiscounts();
    theme.cartQuantity.updateLocalCartState(state, updatedItem);

    if (state.item_count) {
      this.elements.cart.classList.remove(classes$1.isEmpty);
      this.changeCheckoutButtonState(false);
    }
  }

  renderEmptyCart() {
    this.elements.cart.classList.add(classes$1.isEmpty);
    this.changeCheckoutButtonState(true);

    this.elements.cartEmptyText =
      this.elements.cartEmptyText ||
      this.elements.cart.querySelector(selectors$1.emptyText);

    this.elements.cartEmptyText.setAttribute('tabindex', '-1');
    this.elements.cartEmptyText.focus();
  }

  renderCartLevelDiscounts() {
    return fetch(`${theme.rootUrl}?section_id=cart-discounts`)
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        this.elements.discounts =
          this.elements.discounts ||
          this.elements.cart.querySelector(selectors$1.discounts);

        this.elements.discounts.innerHTML = html;
      });
  }

  renderSubtotalPrice(subtotal) {
    const formattedCartPrice = formatMoney(subtotal, theme.moneyFormat);

    this.elements.cartPrice =
      this.elements.cartPrice ||
      document.body.querySelectorAll(selectors$1.cartPrice);

    this.elements.cartPrice.forEach((cartPrice) => {
      cartPrice.innerHTML = formattedCartPrice;
    });
  }

  renderCartCountBubble(itemCount) {
    const cartCountBubbles = document.querySelectorAll(
      selectors$1.cartCountBubble
    );
    const cartCounts = document.querySelectorAll(selectors$1.cartCount);

    cartCounts.forEach(
      (cartCount) => (cartCount.innerText = itemCount > 99 ? '99+' : itemCount)
    );
    cartCountBubbles.forEach((countBubble) =>
      countBubble.classList.toggle(classes$1.hidden, itemCount === 0)
    );
  }

  renderPriceLiveRegion(state) {
    const subtotal = state.total_price;

    this.elements.priceLiveRegion =
      this.elements.priceLiveRegion ||
      this.elements.cart.querySelector(selectors$1.priceLiveRegion);

    const priceLiveRegionText = this.formatPriceLiveRegionText(subtotal);

    this.elements.priceLiveRegion.textContent = priceLiveRegionText;
    this.elements.priceLiveRegion.setAttribute('aria-hidden', false);

    window.setTimeout(() => {
      this.elements.priceLiveRegion.setAttribute('aria-hidden', true);
    }, 1000);
  }

  formatPriceLiveRegionText(subtotal) {
    const formattedSubtotal = formatMoney(subtotal, theme.moneyFormat);
    return `${theme.strings.subtotal}: ${formattedSubtotal}`;
  }

  getItemFromState(key, state) {
    return state.items.find((item) => item.key === key);
  }
}

const selectors$2 = {
  quantityIndicatorId: (id) => `[data-quantity-indicator="${id}"]`,
  quantityNumber: '[data-quantity-number]',
  quantityLabel: '[data-quantity-label]',
};

const classes$2 = {
  inCart: 'in-cart',
  isVisible: 'is-visible',
  updated: 'updated',
};

class CartQuantity {
  constructor() {
    this.cartState = {};
  }

  updateLocalCartState(newState, updatedItem) {
    if (newState) {
      this.cartState = this._convertToLocalCartState(newState);
      this.updateQuantityIndicatorElements([updatedItem]);
    } else {
      getState().then((state) => {
        this.cartState = this._convertToLocalCartState(state);
        this.updateQuantityIndicatorElements();
      });
    }
  }

  updateQuantityIndicatorElements(updatedIds, context = document) {
    const updatedProductIds = updatedIds || Object.keys(this.cartState);

    updatedProductIds.forEach((productId) => {
      const quantity = this.cartState[productId];

      const quantityIndicators = context.querySelectorAll(
        selectors$2.quantityIndicatorId(productId)
      );

      quantityIndicators.forEach((quantityIndicator) => {
        this._setQuantityIndicator(quantityIndicator, quantity);
      });
    });
  }

  _convertToLocalCartState(state) {
    const localCartState = {};

    state.items.forEach((item) => {
      if (!localCartState[item.product_id]) localCartState[item.product_id] = 0;

      localCartState[item.product_id] += item.quantity;
    });

    return localCartState;
  }

  _setQuantityIndicator(quantityIndicator, quantity) {
    if (quantityIndicator.classList.contains(classes$2.isVisible) && quantity) {
      this._animateUpdate(quantityIndicator);
    } else {
      this._animateShowOrHide(quantityIndicator, quantity);
    }

    if (!quantity) return;

    const quantityNumber = quantityIndicator.querySelector(
      selectors$2.quantityNumber
    );
    const quantityText = quantity < 100 ? quantity : '99+';
    quantityNumber.textContent = quantityText;

    const ariaLabel =
      quantity === 1
        ? quantityIndicator.dataset.labelSingle
        : quantityIndicator.dataset.labelMulti.replace('[quantity]', quantity);

    const quantityLabel = quantityIndicator.querySelector(
      selectors$2.quantityLabel
    );
    quantityLabel.textContent = ariaLabel;
  }

  _animateShowOrHide(quantityIndicator, visible) {
    quantityIndicator.classList.toggle(classes$2.inCart, visible);

    if (visible) {
      quantityIndicator.classList.add(classes$2.isVisible);
      return;
    }

    promiseTransitionEnd(quantityIndicator).then(() => {
      quantityIndicator.classList.remove(classes$2.isVisible);
    });
  }

  _animateUpdate(quantityIndicator) {
    quantityIndicator.classList.add(classes$2.updated);

    promiseTransitionEnd(quantityIndicator).then(() => {
      quantityIndicator.classList.remove(classes$2.updated);
    });
  }
}

const selectors$3 = {
  form: '[data-form]',
  formInputWrapper: '[data-form-input-wrapper]',
  formStatus: '[data-form-status]',
};

const classes$3 = {
  floatingLabel: 'form__input-wrapper--floating-label',
};

class Form {
  constructor() {
    const forms = document.querySelectorAll(selectors$3.form);

    forms.forEach((form) => {
      this._focusFormStatus(form);
      this._handleFormInputLabels(form);
    });
  }

  /**
   * If there are elements that contain '[data-form-status]' after submitting a form, focus to that element.
   */
  _focusFormStatus(form) {
    const formStatus = form.querySelector(selectors$3.formStatus);

    if (!formStatus) return;

    formStatus.focus();

    formStatus.addEventListener('blur', () => {
      formStatus.removeAttribute('tabindex');
    });
  }

  _handleFormInputLabels(form) {
    const inputWrappers = form.querySelectorAll(selectors$3.formInputWrapper);

    if (!inputWrappers) return;

    inputWrappers.forEach((inputWrapper) => {
      inputWrapper.addEventListener('focusin', () => {
        inputWrapper.classList.add(classes$3.floatingLabel);
      });

      inputWrapper.addEventListener('focusout', (event) => {
        const input = event.target;

        if (input.value !== '') return;

        inputWrapper.classList.remove(classes$3.floatingLabel);
      });
    });
  }
}

const classes$4 = {
  cookiesDisabled: 'cookies-disabled',
};

class CartTemplate {
  constructor(cartElement) {
    this.elements = {
      cart: cartElement,
    };
  }

  init() {
    if (!cookiesEnabled()) {
      this.elements.cart.classList.add(classes$4.cookiesDisabled);
    }
  }
}

const selectors$4 = {
  arrow: '[data-scroller-arrow]',
  menu: '[data-scroller-content]',
  wrapper: '[data-scroller-wrapper]',
};

const classes$5 = {
  noTransition: 'scroller-content--no-transition',
  wrapper: 'scroller-wrapper',
};

const config = {
  offset: 150,
};

class Scroller {
  constructor(container) {
    this.container = container;
    this.init();
  }

  init() {
    this.wrapper = this.container.querySelector(selectors$4.wrapper);
    if (!this.wrapper) return;

    this.initialized = true;
    this.menu = this.wrapper.querySelector(selectors$4.menu);
    this.arrows = this.container.querySelectorAll(selectors$4.arrow);
    this.isTransitioning = false;

    this._setupEventHandlers();

    promiseStylesheet().then(() => {
      this._recalculateOverflow();
    });
  }

  makeElementVisible(element) {
    if (this.overflowValue === 'none' || !this.initialized) return;

    let elementVisible = true;
    const offset = config.offset / 2;
    const elementRect = element.getBoundingClientRect();
    const elementLeft = Math.floor(elementRect.left) - offset;
    const elementRight = Math.floor(elementRect.right) + offset;

    if (elementRight > this.wrapperRect.right) {
      this.direction = 'next';
      elementVisible = false;
    } else if (elementLeft < this.wrapperRect.left) {
      this.direction = 'previous';
      elementVisible = false;
    }

    if (elementVisible || this.isTransitioning) return;

    this.isTransitioning = true;
    const distance = this._getDistanceToElement(
      elementRight,
      element.offsetLeft,
      offset
    );
    this._setMenuTranslateX(distance);
  }

  destroy() {
    if (!this.initialized) return;
    this.wrapper.removeEventListener(
      'scroll',
      this.eventHandlers.recalculateOverflow,
      { passive: true }
    );

    window.removeEventListener('resize', this.eventHandlers.debounceScroller);

    this.arrows.forEach((arrow) => {
      arrow.removeEventListener('click', this.eventHandlers.onArrowClick);
    });
  }

  _recalculateOverflow() {
    const overflowValue = this._getOverflowValue();
    this._setOverflowClass(overflowValue);
  }

  _setupEventHandlers() {
    this.eventHandlers = this._getEventHandlers();
    this.wrapper.addEventListener(
      'scroll',
      this.eventHandlers.recalculateOverflow,
      { passive: true }
    );

    window.addEventListener('resize', this.eventHandlers.debounceScroller);

    this.arrows.forEach((arrow) => {
      arrow.addEventListener('click', this.eventHandlers.onArrowClick);
    });
  }

  _getEventHandlers() {
    return {
      recalculateOverflow: this._recalculateOverflow.bind(this),
      onArrowClick: this._onArrowClick.bind(this),
      debounceScroller: debounce(() => {
        this._recalculateOverflow();
      }, 250),
    };
  }

  _getOverflowValue() {
    this._getSelectorsDomRect();
    const wrapperLeft = Math.floor(this.wrapperRect.left);
    const wrapperRight = Math.floor(this.wrapperRect.right);
    const menuLeft = Math.floor(this.menuRect.left);
    const menuRight = Math.floor(this.menuRect.right);

    const leftOverflow = menuLeft < wrapperLeft;
    const rightOverflow = menuRight > wrapperRight;

    let overflowValue = 'none';
    if (leftOverflow && rightOverflow) {
      overflowValue = 'both';
    } else if (leftOverflow) {
      overflowValue = 'left';
    } else if (rightOverflow) {
      overflowValue = 'right';
    }

    return overflowValue;
  }

  _getSelectorsDomRect() {
    this.wrapperRect = this.wrapper.getBoundingClientRect();
    this.menuRect = this.menu.getBoundingClientRect();
  }

  _setOverflowClass(overflowValue) {
    if (this.overflowValue === overflowValue) return;

    this.wrapper.classList.remove(`${classes$5.wrapper}--${this.overflowValue}`);

    window.requestAnimationFrame(() => {
      this.wrapper.classList.add(`${classes$5.wrapper}--${overflowValue}`);
      this.overflowValue = overflowValue;
    });
  }

  _onArrowClick(event) {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    this.direction = event.currentTarget.dataset.scrollerArrowDirection;

    const offset = config.offset;
    let distance = this._getDistanceToNextPosition();
    distance = distance < offset * 2 ? distance : offset;
    this._setMenuTranslateX(distance);
  }

  _getDistanceToNextPosition() {
    if (this.direction === 'next') {
      return Math.round(this.menuRect.right - this.wrapperRect.right);
    }

    return this.wrapper.scrollLeft;
  }

  _getDistanceToElement(elementRight, elementLeft, offset) {
    if (this.direction === 'next') {
      const maxDistance = Math.ceil(
        this.menuRect.width - this.wrapperRect.width - this.wrapper.scrollLeft
      );

      let distance = Math.round(elementRight - this.wrapperRect.right) + offset;
      distance = distance < maxDistance ? distance : maxDistance;
      return distance;
    }

    let distance = this.wrapper.scrollLeft - elementLeft + offset;
    distance =
      distance < this.wrapper.scrollLeft ? distance : this.wrapper.scrollLeft;
    return distance;
  }

  _setMenuTranslateX(distance) {
    const translateValue = this.direction === 'next' ? -distance : distance;

    this.menu.style.transform = `translateX(${translateValue}px)`;
    this.translatedValue = translateValue;
    this.menu.classList.remove(classes$5.noTransition);

    promiseTransitionEnd(this.menu).then(() => {
      this._setWrapperScrollLeft();
      this.isTransitioning = false;
    });
  }

  _setWrapperScrollLeft() {
    const translatedValue = Math.abs(this.translatedValue);

    this.menu.style.transform = 'none';
    this.menu.classList.add(classes$5.noTransition);

    if (this.direction === 'previous') {
      this.wrapper.scrollLeft -= translatedValue;
    } else {
      this.wrapper.scrollLeft += translatedValue;
    }
  }
}

const selectors$6 = {
  disclosure: '[data-disclosure]',
  disclosureList: '[data-disclosure-list]',
  disclosureToggle: '[data-disclosure-toggle]',
  disclosureInput: '[data-disclosure-input]',
  disclosureOptions: '[data-disclosure-option]',
};

const classes$6 = {
  listVisible: 'disclosure-list--visible',
};

class Disclosure {
  constructor(container) {
    this.disclosureForm = container;
    this.disclosure = container.querySelector(selectors$6.disclosure);
    this.disclosureList = container.querySelector(selectors$6.disclosureList);
    this.disclosureToggle = container.querySelector(selectors$6.disclosureToggle);
    this.disclosureInput = container.querySelector(selectors$6.disclosureInput);
    this.disclosureOptions = container.querySelectorAll(
      selectors$6.disclosureOptions
    );

    this._setupListeners();
  }

  destroy() {
    this.disclosureToggle.removeEventListener(
      'click',
      this.eventHandlers.toggleList
    );

    this.disclosureOptions.forEach((disclosureOption) =>
      disclosureOption.removeEventListener(
        'click',
        this.eventHandlers.connectOptions
      )
    );

    this.disclosure.removeEventListener(
      'keyup',
      this.eventHandlers.onDisclosureKeyUp
    );

    this.disclosureList.removeEventListener(
      'focusout',
      this.eventHandlers.onDisclosureListFocusOut
    );

    this.disclosureToggle.removeEventListener(
      'focusout',
      this.eventHandlers.onDisclosureToggleFocusOut
    );

    document.body.removeEventListener('click', this.eventHandlers.onBodyClick);
  }

  _setupListeners() {
    this.eventHandlers = this._setupEventHandlers();

    this.disclosureToggle.addEventListener(
      'click',
      this.eventHandlers.toggleList
    );

    this.disclosureOptions.forEach((disclosureOption) => {
      disclosureOption.addEventListener(
        'click',
        this.eventHandlers.connectOptions
      );
    });

    this.disclosure.addEventListener(
      'keyup',
      this.eventHandlers.onDisclosureKeyUp
    );

    this.disclosureList.addEventListener(
      'focusout',
      this.eventHandlers.onDisclosureListFocusOut
    );

    this.disclosureToggle.addEventListener(
      'focusout',
      this.eventHandlers.onDisclosureToggleFocusOut
    );

    document.body.addEventListener('click', this.eventHandlers.onBodyClick);
  }

  _setupEventHandlers() {
    return {
      connectOptions: this._connectOptions.bind(this),
      toggleList: this._toggleList.bind(this),
      onBodyClick: this._onBodyClick.bind(this),
      onDisclosureKeyUp: this._onDisclosureKeyUp.bind(this),
      onDisclosureListFocusOut: this._onDisclosureListFocusOut.bind(this),
      onDisclosureToggleFocusOut: this._onDisclosureToggleFocusOut.bind(this),
    };
  }

  _connectOptions(event) {
    event.preventDefault();

    this._submitForm(event.currentTarget.dataset.value);
  }

  _onDisclosureToggleFocusOut(event) {
    const disclosureLostFocus =
      this.disclosure.contains(event.relatedTarget) === false;

    if (!disclosureLostFocus) return;

    this._toggleList();
  }

  _onDisclosureListFocusOut(event) {
    const childInFocus = event.currentTarget.contains(event.relatedTarget);

    const isVisible = this.disclosureList.classList.contains(
      classes$6.listVisible
    );

    if (isVisible && !childInFocus) {
      this._toggleList();
    }
  }

  _onDisclosureKeyUp(event) {
    if (event.key.toLowerCase() !== keyCodes.ESC) return;
    this._toggleList();
    this.disclosureToggle.focus();
  }

  _onBodyClick(event) {
    const isOption = this.disclosure.contains(event.target);
    const isVisible = this.disclosureList.classList.contains(
      classes$6.listVisible
    );

    if (isVisible && !isOption) {
      this._toggleList();
    }
  }

  _submitForm(value) {
    this.disclosureInput.value = value;
    this.disclosureForm.submit();
  }

  _toggleList() {
    const ariaExpanded =
      this.disclosureToggle.getAttribute('aria-expanded') === 'true';

    this.disclosureList.classList.toggle(classes$6.listVisible);
    this.disclosureToggle.setAttribute('aria-expanded', !ariaExpanded);
  }
}

const selectors$5 = {
  disclosureForm: '[data-disclosure-form]',
};

sections.register('footer', {
  onLoad() {
    const disclosureForms = Array.from(
      this.container.querySelectorAll(selectors$5.disclosureForm)
    );

    this.disclosures = disclosureForms.map((disclosureForm) => {
      return new Disclosure(disclosureForm);
    });
  },

  onUnload() {
    this.disclosures.forEach((disclosure) => disclosure.destroy());
  },
});

const selectors$7 = {
  dropdownMenu: '[data-dropdown-menu]',
  dropdownParent: '[data-dropdown-parent]',
  dropdownParentType: (type) => `[data-dropdown-parent-type="${type}"]`,
  headerIcon: '[data-header-icon]',
  menuNavigation: '[data-menu-navigation]',
  menuNavigationItem: '[data-menu-navigation-item]',
  menuNavigationLastItem: '[data-menu-navigation-last-item]',
  menuNavigationType: (menuType) => `[data-menu-navigation-type="${menuType}"]`,
  mobileNavigationToggle: '[data-mobile-navigation-toggle]',
  mobileNavigationContainer: '[data-mobile-navigation-container]',
  mobileNavigationDrawer: '[data-mobile-navigation-drawer]',
};

const classes$7 = {
  menuNavigationItemIsExpanded: 'menu-navigation__item--is-expanded',
  menuDropdownItemIsExpanded: 'menu-dropdown__item--is-expanded',
  menuNavigationHidden: 'menu-navigation-wrapper--hidden',
};

const attributes = {
  headerLogo: 'data-header-logo',
  headerIcon: 'data-header-icon',
  popupOpen: 'data-popup-open',
  menuNavigationToggle: 'data-mobile-navigation-toggle',
  searchToggle: 'data-search-toggle',
};

const popups = {
  cart: 'cart',
  menuNavigation: 'menu-navigation',
  search: 'search',
};

sections.register('header', {
  onLoad() {
    this.elements = this._getElements();
    this._reloadHeaderPopups();

    this.mqlLarge = window.matchMedia(getMediaQueryString('large'));
    this.mqlSmall = window.matchMedia(getMediaQueryString('medium', 'max'));

    this.drawerMenuIsActive = !this.mqlLarge.matches;

    if (this.elements.menuNavigation) this._handleMenuNavigationWidth();
    this._setupEventHandlers();
  },

  _reloadHeaderPopups() {
    if (!window.popups) return;

    if (
      !window.popups.find((popup) => popup.name === popups.menuNavigation) &&
      this.elements.menuNavigation
    ) {
      window.popups.push(new Popup(popups.menuNavigation));
    }

    Object.values(popups).forEach((popupType) => {
      const targetPopup = window.popups.find(
        (popup) => popup.name === popupType
      );

      if (!targetPopup) return;

      targetPopup.init();
    });
  },

  _getElements() {
    return {
      cartPriceBubbleContainers: this.container.querySelectorAll(
        selectors$7.cartPriceBubbleContainer
      ),
      desktopNavigation: this.container.querySelector(
        selectors$7.menuNavigationType('desktop')
      ),
      dropdownParents: this.container.querySelectorAll(
        selectors$7.dropdownParent
      ),
      headerIcons: Array.from(
        this.container.querySelectorAll(selectors$7.headerIcon)
      ),
      menuNavigation: this.container.querySelector(selectors$7.menuNavigation),
      menuNavigationItems: this.container.querySelectorAll(
        selectors$7.menuNavigationItem
      ),
      mobileNavigationToggle: this.container.querySelector(
        selectors$7.mobileNavigationToggle
      ),
    };
  },

  _setupEventHandlers() {
    this.eventHandlers = this._getEventHandlers();

    if (!this.elements.menuNavigation) return;

    this.elements.dropdownParents.forEach((parent) =>
      parent.addEventListener('click', this.eventHandlers.onDropdownParentClick)
    );

    window.addEventListener('resize', this.eventHandlers.onWindowResize);

    this.elements.mobileNavigationToggle.addEventListener(
      'click',
      this.eventHandlers.handleMobileNavigation
    );
  },

  _getEventHandlers() {
    return {
      handleMultiplePopups: this._handleMultiplePopups.bind(this),
      onBodyClick: this._onBodyClick.bind(this),
      onDrawerNavigationKeyup: this._onDrawerNavigationKeyup.bind(this),
      onDropdownFocusOut: this._onDropdownFocusOut.bind(this),
      onDropdownKeyup: this._onDropdownKeyup.bind(this),
      onDropdownParentClick: this._onDropdownParentClick.bind(this),
      onWindowResize: debounce(() => this._onWindowResize(), 250),
      handleMobileNavigation: this._handleMobileNavigation.bind(this),
    };
  },

  _onWindowResize() {
    const activeParentDropdown = this._getDesktopActiveParentDropdown();
    const isDrawerNavigationOpen =
      this.elements.mobileNavigationToggle.getAttribute('aria-expanded') ===
      'true';

    this._handleMenuNavigationWidth();

    if (this.drawerMenuIsActive && activeParentDropdown) {
      this._toggleDesktopDropdownOnResize();
    } else if (!this.drawerMenuIsActive && activeParentDropdown) {
      this.elements.menuNavigation.style.overflow = 'initial';
    } else if (isDrawerNavigationOpen && !this.drawerMenuIsActive) {
      this._closeMobileNavigation();
    } else if (isDrawerNavigationOpen && this.drawerMenuIsActive) {
      this._toggleHeaderIcons(true);
    }
  },

  // This function is a WIP - open to suggestions on how to handle jumping when opening menu
  _handleMenuNavigationWidth() {
    if (!this.mqlLarge.matches) {
      this.drawerMenuIsActive = true;
      return;
    }

    this.elements.menuNavigation.style.overflow = 'hidden';

    const menuPositionRight = this.elements.menuNavigation.getBoundingClientRect()
      .right;
    const lastMenuItemPositionRight = this.elements.menuNavigation
      .querySelector(selectors$7.menuNavigationLastItem)
      .getBoundingClientRect().right;

    if (menuPositionRight >= lastMenuItemPositionRight) {
      this.elements.menuNavigation.classList.remove(
        classes$7.menuNavigationHidden
      );

      this.drawerMenuIsActive = false;
    } else {
      this.elements.menuNavigation.classList.add(classes$7.menuNavigationHidden);
      this.drawerMenuIsActive = true;
    }
  },

  _onDropdownFocusOut(event) {
    event.preventDefault();

    if (event.currentTarget.contains(event.relatedTarget)) return;

    const dropdownParent = event.currentTarget.previousElementSibling;

    this._toggleMenuDropdown(dropdownParent);
  },

  _toggleDesktopDropdownOnResize() {
    const activeParent = this._getDesktopActiveParentDropdown();

    if (!activeParent) return;

    this._animateDropdownClosed(
      activeParent.nextElementSibling,
      activeParent,
      false
    );
  },

  _getDesktopActiveParentDropdown() {
    return this.elements.desktopNavigation.querySelector(
      `${selectors$7.dropdownParent}${selectors$7.dropdownParentType(
        'main'
      )}[aria-expanded="true"]`
    );
  },

  _onDropdownParentClick(event) {
    const parent = event.currentTarget;

    if (
      parent.dataset.dropdownParentType === 'main' &&
      parent.closest(selectors$7.menuNavigationType('desktop'))
    ) {
      event.stopImmediatePropagation();
      this._onBodyClick();
    }

    const dropdowns = parent.parentElement.querySelectorAll(
      selectors$7.dropdownMenu
    );

    this._setupDropdowns(dropdowns);
    this._toggleMenuDropdown(parent);
  },

  _setupDropdowns(dropdownMenus) {
    dropdownMenus.forEach((dropdown, index) => {
      if (dropdown.dataset.maxHeight) return;

      if (
        index === 0 &&
        dropdown.closest(selectors$7.menuNavigationType('desktop'))
      ) {
        this._setupMainLevelDropdown(dropdown);
      } else {
        this._setupChildAndMobileDropdown(dropdown);
      }
    });
  },

  _setupMainLevelDropdown(dropdown) {
    dropdown.style.whiteSpace = 'nowrap';

    const { width, height } = dropdown.getBoundingClientRect();

    dropdown.dataset.width = `${width}px`;
    dropdown.style.width = width < 260 ? `${width}px` : '26rem';
    dropdown.style.removeProperty('white-space');
    dropdown.dataset.maxHeight =
      width < 260
        ? `${height}px`
        : `${dropdown.getBoundingClientRect().height}px`;
    dropdown.style.maxHeight = '0px';
  },

  _setupChildAndMobileDropdown(dropdown) {
    dropdown.dataset.maxHeight = `${dropdown.getBoundingClientRect().height}px`;
    dropdown.style.maxHeight = '0px';
  },

  _toggleMenuDropdown(parent) {
    const isExpanded = parent.getAttribute('aria-expanded') === 'true';
    const dropdown = parent.nextElementSibling;

    if (isExpanded) {
      this._animateDropdownClosed(dropdown, parent);
    } else {
      this._animateDropdownOpen(dropdown, parent);
    }
  },

  _animateDropdownClosed(dropdown, parent, animate = true) {
    const isSecondLevelDropdown = parent.dataset.dropdownParentType === 'main';

    if (isSecondLevelDropdown) {
      parent.classList.remove(classes$7.menuNavigationItemIsExpanded);

      if (dropdown.closest(selectors$7.menuNavigationType('desktop')))
        dropdown.removeEventListener(
          'focusout',
          this.eventHandlers.onDropdownFocusOut
        );
    } else {
      parent.classList.remove(classes$7.menuDropdownItemIsExpanded);
    }

    dropdown.style.maxHeight = '0px';
    dropdown.style.opacity = 0;

    if (animate) {
      promiseTransitionEnd(dropdown).then(() => {
        this._closeDropdown(parent, dropdown, isSecondLevelDropdown);
      });
    } else {
      this._closeDropdown(parent, dropdown, isSecondLevelDropdown);
    }
  },

  _closeDropdown(parent, dropdown, isSecondLevelDropdown) {
    parent.setAttribute('aria-expanded', 'false');

    if (
      !isSecondLevelDropdown ||
      !dropdown.closest(selectors$7.menuNavigationType('desktop'))
    )
      return;

    if (!this._getDesktopActiveParentDropdown()) {
      this.elements.menuNavigation.style.overflow = 'hidden';
    }

    document.body.removeEventListener('click', this.eventHandlers.onBodyClick);

    dropdown.removeEventListener('click', this._preventDropdownClick);

    parent.parentNode.removeEventListener(
      'keyup',
      this.eventHandlers.onDropdownKeyup
    );
  },

  _animateDropdownOpen(dropdown, parent) {
    const isSecondLevelDropdown = parent.dataset.dropdownParentType === 'main';
    const isDesktopNavigation = parent.closest(
      selectors$7.menuNavigationType('desktop')
    );

    if (isSecondLevelDropdown) {
      if (isDesktopNavigation)
        this.elements.menuNavigation.style.overflow = 'initial';
      parent.classList.add(classes$7.menuNavigationItemIsExpanded);

      if (isDesktopNavigation)
        dropdown.addEventListener(
          'focusout',
          this.eventHandlers.onDropdownFocusOut
        );
    } else {
      parent.classList.add(classes$7.menuDropdownItemIsExpanded);
    }

    parent.setAttribute('aria-expanded', 'true');
    dropdown.style.maxHeight = `${dropdown.dataset.maxHeight}`;
    dropdown.style.opacity = 1;

    if (!isDesktopNavigation || !isSecondLevelDropdown) return;

    promiseTransitionEnd(dropdown).then(() => {
      document.body.addEventListener('click', this.eventHandlers.onBodyClick);

      dropdown.addEventListener('click', this._preventDropdownClick);

      parent.parentNode.addEventListener(
        'keyup',
        this.eventHandlers.onDropdownKeyup
      );
    });
  },

  _onDropdownKeyup(event) {
    if (event.key.toLowerCase() !== keyCodes.ESC) return;

    const listItem = event.currentTarget;
    const parent = listItem.querySelector(selectors$7.dropdownParentType('main'));
    const dropdown = parent.nextElementSibling;

    this._animateDropdownClosed(dropdown, parent);
    parent.focus();
  },

  _preventDropdownClick(event) {
    event.stopImmediatePropagation();
  },

  _onBodyClick() {
    const expandedParentDropdown = this._getDesktopActiveParentDropdown();

    if (!expandedParentDropdown) return;
    const expandedDropdown = expandedParentDropdown.nextElementSibling;

    this._animateDropdownClosed(expandedDropdown, expandedParentDropdown);
  },

  _handleMobileNavigation(event) {
    const toggle = event.currentTarget;
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
      this._closeMobileNavigation();
    } else {
      this._openMobileNavigation(toggle);
    }
  },

  _closeMobileNavigation() {
    this._toggleHeaderIcons();

    if (this.elements.headerButtons.length) {
      this.elements.headerButtons.forEach((button) =>
        button.removeEventListener(
          'click',
          this.eventHandlers.handleMultiplePopups
        )
      );
    }

    document.removeEventListener(
      'keyup',
      this.eventHandlers.onDrawerNavigationKeyup
    );

    document.removeEventListener('focusin', this._onBodyFocusIn);

    this.elements.drawerNavigationPopup.closePopup(false);
  },

  _openMobileNavigation(toggle) {
    this.elements.drawerNavigationPopup =
      this.elements.drawerNavigationPopup ||
      window.popups.find((popup) => popup.name === popups.menuNavigation);

    this.elements.headerButtons =
      this.elements.headerButtons ||
      this.elements.headerIcons.filter((icon) =>
        icon.hasAttribute(attributes.popupOpen)
      );

    this._setupMobileNavigationDropdowns();
    this._setMobileDrawerHeight();
    this._toggleHeaderIcons(true);

    if (this.elements.headerButtons.length) {
      this.elements.headerButtons.forEach((button) =>
        button.addEventListener(
          'click',
          this.eventHandlers.handleMultiplePopups
        )
      );
    }

    document.addEventListener(
      'keyup',
      this.eventHandlers.onDrawerNavigationKeyup
    );

    // to prevent menu drawer close button from displaying when
    // clicking focusable elements in the heading
    document.addEventListener('focusin', this._onBodyFocusIn);

    this.elements.drawerNavigationPopup.openPopup({ currentTarget: toggle });
  },

  _onBodyFocusIn(event) {
    const target = event.target;
    if (
      target.hasAttribute(attributes.headerIcon) ||
      target.hasAttribute(attributes.menuNavigationToggle) ||
      target.hasAttribute(attributes.headerLogo)
    )
      event.stopImmediatePropagation();
  },

  _setupMobileNavigationDropdowns() {
    if (this.elements.mobileNavigation) return;

    this.elements.mobileNavigation = this.container.querySelector(
      selectors$7.menuNavigationType('mobile')
    );

    this.elements.mobileMenuParents = this.elements.mobileNavigation.querySelectorAll(
      selectors$7.dropdownParent
    );

    this.elements.mobileMenuParents.forEach((parent) =>
      this._setupDropdowns(
        parent.parentElement.querySelectorAll(selectors$7.dropdownMenu)
      )
    );
  },

  _setMobileDrawerHeight() {
    this.elements.mobileNavigationContainer =
      this.elements.mobileNavigationContainer ||
      this.container.querySelector(selectors$7.mobileNavigationContainer);

    this.elements.mobileNavigationDrawer =
      this.elements.mobileNavigationDrawer ||
      this.container.querySelector(selectors$7.mobileNavigationDrawer);

    const headerHeight = this.container.getBoundingClientRect().height;
    const scrollPosition = window.pageYOffset;

    const heightDifference = headerHeight - scrollPosition;
    this.elements.mobileNavigationDrawer.style.top = `${heightDifference}px`;
    this.elements.mobileNavigationContainer.style.height = `calc(100vh - ${heightDifference}px)`;
  },

  _toggleHeaderIcons(isDrawerNavigationOpen = false) {
    const setHidden = this.mqlSmall.matches && isDrawerNavigationOpen;

    this.elements.headerIcons.forEach((toggle) =>
      toggle.toggleAttribute('hidden', setHidden)
    );
  },

  _handleMultiplePopups(event) {
    this.elements.popups = this.elements.popups || {};

    const popupType = event.currentTarget.hasAttribute(attributes.searchToggle)
      ? popups.search
      : popups.cart;

    this.elements.popups[popupType] =
      this.elements.popups[popupType] ||
      window.popups.find((popup) => popup.name === popupType);

    const popupElements = this.elements.popups[popupType].getElements();

    if (popupType === popups.search) {
      this._closeMobileNavigation();
    } else {
      promiseTransitionEnd(popupElements.popup).then(() => {
        this._closeMobileNavigation();
      });
    }
  },

  _onDrawerNavigationKeyup(event) {
    if (event.key.toLowerCase() !== keyCodes.ESC) return;

    this._toggleHeaderIcons();
    document.removeEventListener(
      'keyup',
      this.eventHandlers.onDrawerNavigationKeyup
    );
  },

  onUnload() {
    this.elements.dropdownParents.forEach((parent) =>
      parent.removeEventListener(
        'click',
        this.eventHandlers.onDropdownParentClick
      )
    );

    if (!this.elements.menuNavigation) return;

    window.removeEventListener('resize', this.eventHandlers.onWindowResize);

    this.elements.mobileNavigationToggle.removeEventListener(
      'click',
      this.eventHandlers.handleMobileNavigation
    );
  },
});

function Listeners() {
  this.entries = [];
}

Listeners.prototype.add = function(element, event, fn) {
  this.entries.push({ element: element, event: event, fn: fn });
  element.addEventListener(event, fn);
};

Listeners.prototype.removeAll = function() {
  this.entries = this.entries.filter(function(listener) {
    listener.element.removeEventListener(listener.event, listener.fn);
    return false;
  });
};

/**
 * Returns a product JSON object when passed a product URL
 * @param {*} url
 */


/**
 * Find a match in the project JSON (using a ID number) and return the variant (as an Object)
 * @param {Object} product Product JSON object
 * @param {Number} value Accepts Number (e.g. 6908023078973)
 * @returns {Object} The variant object once a match has been successful. Otherwise null will be return
 */


/**
 * Convert the Object (with 'name' and 'value' keys) into an Array of values, then find a match & return the variant (as an Object)
 * @param {Object} product Product JSON object
 * @param {Object} collection Object with 'name' and 'value' keys (e.g. [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }])
 * @returns {Object || null} The variant object once a match has been successful. Otherwise null will be returned
 */
function getVariantFromSerializedArray(product, collection) {
  _validateProductStructure(product);

  // If value is an array of options
  var optionArray = _createOptionArrayFromOptionCollection(product, collection);
  return getVariantFromOptionArray(product, optionArray);
}

/**
 * Find a match in the project JSON (using Array with option values) and return the variant (as an Object)
 * @param {Object} product Product JSON object
 * @param {Array} options List of submitted values (e.g. ['36', 'Black'])
 * @returns {Object || null} The variant object once a match has been successful. Otherwise null will be returned
 */
function getVariantFromOptionArray(product, options) {
  _validateProductStructure(product);
  _validateOptionsArray(options);

  var result = product.variants.filter(function(variant) {
    return options.every(function(option, index) {
      return variant.options[index] === option;
    });
  });

  return result[0] || null;
}

/**
 * Creates an array of selected options from the object
 * Loops through the project.options and check if the "option name" exist (product.options.name) and matches the target
 * @param {Object} product Product JSON object
 * @param {Array} collection Array of object (e.g. [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }])
 * @returns {Array} The result of the matched values. (e.g. ['36', 'Black'])
 */
function _createOptionArrayFromOptionCollection(product, collection) {
  _validateProductStructure(product);
  _validateSerializedArray(collection);

  var optionArray = [];

  collection.forEach(function(option) {
    for (var i = 0; i < product.options.length; i++) {
      if (product.options[i].name.toLowerCase() === option.name.toLowerCase()) {
        optionArray[i] = option.value;
        break;
      }
    }
  });

  return optionArray;
}

/**
 * Check if the product data is a valid JS object
 * Error will be thrown if type is invalid
 * @param {object} product Product JSON object
 */
function _validateProductStructure(product) {
  if (typeof product !== 'object') {
    throw new TypeError(product + ' is not an object.');
  }

  if (Object.keys(product).length === 0 && product.constructor === Object) {
    throw new Error(product + ' is empty.');
  }
}

/**
 * Validate the structure of the array
 * It must be formatted like jQuery's serializeArray()
 * @param {Array} collection Array of object [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }]
 */
function _validateSerializedArray(collection) {
  if (!Array.isArray(collection)) {
    throw new TypeError(collection + ' is not an array.');
  }

  if (collection.length === 0) {
    return [];
  }

  if (collection[0].hasOwnProperty('name')) {
    if (typeof collection[0].name !== 'string') {
      throw new TypeError(
        'Invalid value type passed for name of option ' +
          collection[0].name +
          '. Value should be string.'
      );
    }
  } else {
    throw new Error(collection[0] + 'does not contain name key.');
  }
}

/**
 * Validate the structure of the array
 * It must be formatted as list of values
 * @param {Array} collection Array of object (e.g. ['36', 'Black'])
 */
function _validateOptionsArray(options) {
  if (Array.isArray(options) && typeof options[0] === 'object') {
    throw new Error(options + 'is not a valid array of options.');
  }
}

var selectors$9 = {
  idInput: '[name="id"]',
  optionInput: '[name^="options"]',
  quantityInput: '[name="quantity"]',
  propertyInput: '[name^="properties"]'
};

// Public Methods
// -----------------------------------------------------------------------------

/**
 * Returns a URL with a variant ID query parameter. Useful for updating window.history
 * with a new URL based on the currently select product variant.
 * @param {string} url - The URL you wish to append the variant ID to
 * @param {number} id  - The variant ID you wish to append to the URL
 * @returns {string} - The new url which includes the variant ID query parameter
 */



/**
 * Constructor class that creates a new instance of a product form controller.
 *
 * @param {Element} element - DOM element which is equal to the <form> node wrapping product form inputs
 * @param {Object} product - A product object
 * @param {Object} options - Optional options object
 * @param {Function} options.onOptionChange - Callback for whenever an option input changes
 * @param {Function} options.onQuantityChange - Callback for whenever an quantity input changes
 * @param {Function} options.onPropertyChange - Callback for whenever a property input changes
 * @param {Function} options.onFormSubmit - Callback for whenever the product form is submitted
 */
function ProductForm(element, product, options) {
  this.element = element;
  this.product = _validateProductObject(product);

  options = options || {};

  this._listeners = new Listeners();
  this._listeners.add(
    this.element,
    'submit',
    this._onSubmit.bind(this, options)
  );

  this.optionInputs = this._initInputs(
    selectors$9.optionInput,
    options.onOptionChange
  );

  this.quantityInputs = this._initInputs(
    selectors$9.quantityInput,
    options.onQuantityChange
  );

  this.propertyInputs = this._initInputs(
    selectors$9.propertyInput,
    options.onPropertyChange
  );
}

/**
 * Cleans up all event handlers that were assigned when the Product Form was constructed.
 * Useful for use when a section needs to be reloaded in the theme editor.
 */
ProductForm.prototype.destroy = function() {
  this._listeners.removeAll();
};

/**
 * Getter method which returns the array of currently selected option values
 *
 * @returns {Array} An array of option values
 */
ProductForm.prototype.options = function() {
  return _serializeOptionValues(this.optionInputs, function(item) {
    var regex = /(?:^(options\[))(.*?)(?:\])/;
    item.name = regex.exec(item.name)[2]; // Use just the value between 'options[' and ']'
    return item;
  });
};

/**
 * Getter method which returns the currently selected variant, or `null` if variant
 * doesn't exist.
 *
 * @returns {Object|null} Variant object
 */
ProductForm.prototype.variant = function() {
  return getVariantFromSerializedArray(this.product, this.options());
};

/**
 * Getter method which returns a collection of objects containing name and values
 * of property inputs
 *
 * @returns {Array} Collection of objects with name and value keys
 */
ProductForm.prototype.properties = function() {
  var properties = _serializePropertyValues(this.propertyInputs, function(
    propertyName
  ) {
    var regex = /(?:^(properties\[))(.*?)(?:\])/;
    var name = regex.exec(propertyName)[2]; // Use just the value between 'properties[' and ']'
    return name;
  });

  return Object.entries(properties).length === 0 ? null : properties;
};

/**
 * Getter method which returns the current quantity or 1 if no quantity input is
 * included in the form
 *
 * @returns {Array} Collection of objects with name and value keys
 */
ProductForm.prototype.quantity = function() {
  return this.quantityInputs[0]
    ? Number.parseInt(this.quantityInputs[0].value, 10)
    : 1;
};

// Private Methods
// -----------------------------------------------------------------------------
ProductForm.prototype._setIdInputValue = function(value) {
  var idInputElement = this.element.querySelector(selectors$9.idInput);

  if (!idInputElement) {
    idInputElement = document.createElement('input');
    idInputElement.type = 'hidden';
    idInputElement.name = 'id';
    this.element.appendChild(idInputElement);
  }

  idInputElement.value = value.toString();
};

ProductForm.prototype._onSubmit = function(options, event) {
  event.dataset = this._getProductFormEventData();

  this._setIdInputValue(event.dataset.variant.id);

  if (options.onFormSubmit) {
    options.onFormSubmit(event);
  }
};

ProductForm.prototype._onFormEvent = function(cb) {
  if (typeof cb === 'undefined') {
    return Function.prototype;
  }

  return function(event) {
    event.dataset = this._getProductFormEventData();
    cb(event);
  }.bind(this);
};

ProductForm.prototype._initInputs = function(selector, cb) {
  var elements = Array.prototype.slice.call(
    this.element.querySelectorAll(selector)
  );

  return elements.map(
    function(element) {
      this._listeners.add(element, 'change', this._onFormEvent(cb));
      return element;
    }.bind(this)
  );
};

ProductForm.prototype._getProductFormEventData = function() {
  return {
    options: this.options(),
    variant: this.variant(),
    properties: this.properties(),
    quantity: this.quantity()
  };
};

function _serializeOptionValues(inputs, transform) {
  return inputs.reduce(function(options, input) {
    if (
      input.checked || // If input is a checked (means type radio or checkbox)
      (input.type !== 'radio' && input.type !== 'checkbox') // Or if its any other type of input
    ) {
      options.push(transform({ name: input.name, value: input.value }));
    }

    return options;
  }, []);
}

function _serializePropertyValues(inputs, transform) {
  return inputs.reduce(function(properties, input) {
    if (
      input.checked || // If input is a checked (means type radio or checkbox)
      (input.type !== 'radio' && input.type !== 'checkbox') // Or if its any other type of input
    ) {
      properties[transform(input.name)] = input.value;
    }

    return properties;
  }, {});
}

function _validateProductObject(product) {
  if (typeof product !== 'object') {
    throw new TypeError(product + ' is not an object.');
  }

  if (typeof product.variants[0].options === 'undefined') {
    throw new TypeError(
      'Product object is invalid. Make sure you use the product object that is output from {{ product | json }} or from the http://[your-product-url].js route'
    );
  }

  return product;
}

const selectors$10 = {
  mediaArrowPrev: '[data-media-arrow-previous]',
  mediaArrowNext: '[data-media-arrow-next]',
  mediaCurrent: '[data-media-current]',
  mediaImages: '[data-media-image]',
  mediaLiveRegion: '[data-media-liveregion]',
  strip: '[data-media-strip]',
  mediaIndicatorLabel: '[data-media-indicator-label]',
  mediaWrapper: '[data-media-wrapper]',
  mediaStripWrapper: '[data-media-strip-wrapper]',
};

const classes$9 = {
  isActive: 'is-active',
  transitionReady: 'transition-ready',
};

class Gallery {
  constructor(container) {
    this.elements = { container };
    this.navigationOnClick = Boolean(
      this.elements.container.dataset.mediaClickNav
    );
  }

  init() {
    Object.assign(this.elements, this.getElements());

    this.eventHandlers = this.setupEventHandlers();
    this.bindEvents();

    this.state = this.setInitialState();
    this.setIndicatorLabel();
    this.hideMedia();
    this.applyTransformation();
    window.setTimeout(() => this.enableTransition());
    this.preloadAdjacentImages();
  }

  getElements() {
    return {
      arrowNext: this.elements.container.querySelector(
        selectors$10.mediaArrowNext
      ),
      arrowPrev: this.elements.container.querySelector(
        selectors$10.mediaArrowPrev
      ),
      currentIndex: this.elements.container.querySelector(
        selectors$10.mediaCurrent
      ),
      images: Array.from(
        this.elements.container.querySelectorAll(selectors$10.mediaImages)
      ),
      liveRegionContent: this.elements.container.querySelector(
        selectors$10.mediaLiveRegion
      ),
      galleryIndicator: this.elements.container.querySelector(
        selectors$10.mediaIndicatorLabel
      ),
      mediaWrapper: this.elements.container.querySelectorAll(
        selectors$10.mediaWrapper
      ),
      mediaStripWrapper: this.elements.container.querySelector(
        selectors$10.mediaStripWrapper
      ),
    };
  }

  setupEventHandlers() {
    return {
      onArrowClick: this.onArrowClick.bind(this),
      onKeyUp: this.onKeyUp.bind(this),
      onImageClick: this.onImageClick.bind(this),
    };
  }

  bindEvents() {
    [this.elements.arrowNext, this.elements.arrowPrev].forEach((arrow) => {
      arrow.addEventListener('click', this.eventHandlers.onArrowClick);
    });

    this.elements.container.addEventListener(
      'keyup',
      this.eventHandlers.onKeyUp
    );

    if (this.navigationOnClick) {
      this.elements.images.forEach((image) => {
        image.addEventListener('click', this.eventHandlers.onImageClick);
      });
    }
  }

  destroy() {
    [this.elements.arrowNext, this.elements.arrowPrev].forEach((arrow) => {
      arrow.removeEventListener('click', this.eventHandlers.onArrowClick);
    });

    this.elements.container.removeEventListener(
      'keyup',
      this.eventHandlers.onKeyUp
    );

    this.elements.images.forEach((image) => {
      image.removeEventListener('click', this.eventHandlers.onImageClick);
    });
  }

  setInitialState() {
    const activeImage = this.elements.images.find((image) =>
      image.classList.contains(classes$9.isActive)
    );

    return {
      activeMediaImage: activeImage,
      mediaId: Number(activeImage.dataset.mediaId),
      mediaIndex: Number(activeImage.dataset.mediaIndex),
      activeMediaTotalImages: this.elements.images.length,
      useAriaHidden: true,
    };
  }

  onArrowClick(event) {
    event.preventDefault();
    this.state.isNext = 'mediaArrowNext' in event.currentTarget.dataset;
    this.goToAdjacentMedia();
  }

  onKeyUp(event) {
    if (
      event.key.toLowerCase() !== keyCodes.LEFT &&
      event.key.toLowerCase() !== keyCodes.RIGHT
    ) {
      return;
    }

    event.preventDefault();
    this.state.isNext = event.key.toLowerCase() === keyCodes.RIGHT;
    this.goToAdjacentMedia();
  }

  onImageClick(event) {
    const imageClickedIndex = event.currentTarget.dataset.mediaIndex;
    const activeImageIndex = this.elements.images.find((image) =>
      image.classList.contains(classes$9.isActive)
    ).dataset.mediaIndex;
    this.state.isNext = imageClickedIndex > activeImageIndex;
    if (imageClickedIndex !== activeImageIndex) {
      this.goToAdjacentMedia();
    }
  }

  goToAdjacentMedia() {
    this.setMediaIndex();
    this.setActiveMedia('mediaIndex');
    this.state.mediaId = Number(this.state.activeMediaImage.dataset.mediaId);
    this.renderGallery();
  }

  variantMediaSwitch(featuredMediaId) {
    if (featuredMediaId === this.state.mediaId) return;
    this.state.mediaId = featuredMediaId;
    this.setActiveMedia('mediaId');
    this.state.mediaIndex = Number(
      this.state.activeMediaImage.dataset.mediaIndex
    );
    this.renderGallery();
  }

  cacheElement(name) {
    this.elements[name] =
      this.elements[name] ||
      this.elements.container.querySelector(selectors$10[name]);
  }

  setActiveMedia(propertyQuery) {
    this.state.activeMediaImage = this.elements.images.find(
      (image) =>
        Number(image.dataset[propertyQuery]) === this.state[propertyQuery]
    );
  }

  setMediaIndex() {
    this.state.mediaIndex = this.state.isNext
      ? this.nextImage()
      : this.previousImage();
  }

  nextImage() {
    return this.state.mediaIndex === this.state.activeMediaTotalImages
      ? 1
      : this.state.mediaIndex + 1;
  }

  previousImage() {
    return this.state.mediaIndex === 1
      ? this.state.activeMediaTotalImages
      : this.state.mediaIndex - 1;
  }

  preloadAdjacentImages() {
    this.elements.images
      .filter((image) =>
        [this.nextImage(), this.previousImage()].includes(
          Number(image.dataset.mediaIndex)
        )
      )
      .forEach((image) => this.loadImage(image));
  }

  applyActiveClass() {
    this.state.activeMediaImage.classList.add(classes$9.isActive);
    this.loadImage(this.state.activeMediaImage);
  }

  hideMedia() {
    if (!this.state.useAriaHidden) return;

    this.elements.images.forEach((image) => {
      if (!image.classList.contains(classes$9.isActive)) {
        image
          .closest(selectors$10.mediaWrapper)
          .setAttribute('aria-hidden', 'true');
        return;
      }
      image.closest(selectors$10.mediaWrapper).removeAttribute('aria-hidden');
    });
  }

  getIndicatorText() {
    const indicatorTextContent = this.elements.liveRegionContent.dataset
      .mediaLiveregionMessage;

    return indicatorTextContent
      .replace('[index]', this.state.mediaIndex)
      .replace('[indexTotal]', this.state.activeMediaTotalImages);
  }

  setIndicatorLabel() {
    const indicatorText = this.getIndicatorText();
    this.elements.galleryIndicator.setAttribute('aria-label', indicatorText);
  }

  updateLiveRegion() {
    const indicatorText = this.getIndicatorText();

    this.elements.liveRegionContent.setAttribute('aria-hidden', false);
    this.elements.liveRegionContent.textContent = indicatorText;

    setTimeout(() => {
      this.elements.liveRegionContent.setAttribute('aria-hidden', true);
    }, 2000);
  }

  loadImage(image) {
    if (!image.getAttribute('src')) {
      image.setAttribute('src', image.dataset.src);
    }

    if (!image.getAttribute('srcset')) {
      image.setAttribute('srcset', image.dataset.srcset);
    }
  }

  clearActiveClasses() {
    this.elements.images.forEach((image) =>
      image.classList.remove(classes$9.isActive)
    );
  }

  renderCurrentIndex() {
    this.elements.currentIndex.textContent = this.state.mediaIndex;
  }

  enableTransition() {
    this.cacheElement('strip');
    this.elements.strip.classList.add(classes$9.transitionReady);
  }

  applyTransformation() {
    this.cacheElement('strip');

    const transformationDistance = 100 * (this.state.mediaIndex - 1);
    this.elements.strip.style.transform = `translateX(-${transformationDistance}%)`;
  }

  resetTransformation() {
    this.cacheElement('strip');

    this.elements.strip.classList.remove(classes$9.transitionReady);
    this.elements.strip.style.transform = `translateX(0)`;
  }

  addAccessibilityAttr() {
    this.elements.container.setAttribute(
      'aria-roledescription',
      theme.strings.mediaCarousel
    );
    this.elements.mediaStripWrapper.setAttribute('aria-live', 'polite');
    this.elements.mediaWrapper.forEach((wrapper) => {
      wrapper.setAttribute('role', 'group');
      wrapper.setAttribute('aria-roledescription', theme.strings.mediaSlide);
      wrapper.setAttribute('aria-label', wrapper.dataset.mediaLabel);
    });
  }

  removeAccessibilityAttr() {
    this.elements.container.removeAttribute('aria-roledescription');
    this.elements.mediaWrapper.forEach((wrapper) => {
      wrapper.removeAttribute('aria-roledescription');
      wrapper.removeAttribute('aria-label');
      wrapper.removeAttribute('role');
    });
    this.elements.images.forEach((image) => {
      image.closest(selectors$10.mediaWrapper).removeAttribute('aria-hidden');
    });
    this.elements.mediaStripWrapper.removeAttribute('aria-live');
  }

  renderGallery() {
    this.clearActiveClasses();
    this.applyActiveClass();
    this.hideMedia();
    this.applyTransformation();
    this.renderCurrentIndex();
    this.setIndicatorLabel();
    this.updateLiveRegion();
    this.preloadAdjacentImages();
  }
}

const attributes$1 = {
  dataQuantitySelectorIncrease: 'data-quantity-selector-increase',
};

const selectors$8 = {
  addToCart: '[data-add-to-cart]',
  addToCartText: '[data-add-to-cart-text]',
  cartCountBubble: '[data-cart-count-bubble]',
  cartCount: '[data-cart-count]',
  cartPriceBubble: '[data-cart-price-bubble]',
  errorMessageWrapper: '[data-error-message-wrapper]',
  errorMessage: '[data-error-message]',
  price: '[data-price]',
  productForm: '[data-product-form]',
  productMasterSelect: '[data-product-master-select]',
  productPolicies: '[data-product-policies]',
  regularPrice: '[data-regular-price]',
  productSuccessMessage: '[data-product-success-message]',
  productStatus: '[data-product-status]',
  salePrice: '[data-sale-price]',
  unitPrice: '[data-unit-price]',
  unitPriceBaseUnit: '[data-unit-price-base-unit]',
  quantityInput: '[data-quantity-input]',
  quantityInputWrapper: '[data-quantity-input-wrapper]',
  quantitySelectors: '[data-quantity-selector]',
  media: '[data-media]',
  singleMedia: '[data-media-image]',
  strip: '[data-media-strip]',
};

const classes$8 = {
  hidden: 'hidden',
  formInputError: 'form__input-wrapper--error',
  productOnSale: 'price--on-sale',
  productSoldOut: 'price--sold-out',
  productUnitAvailable: 'price--unit-available',
  productUnavailable: 'price--unavailable',
  visuallyHidden: 'visually-hidden',
  transitionReady: 'transition-ready',
};

class Product {
  constructor(container) {
    this.container = container;

    this.eventHandlers = {};
    this.productFormElement = this.container.querySelector(
      selectors$8.productForm
    );

    if (!this.productFormElement) return;
    this._prepareGallery();

    this._getProductJSON(this.productFormElement.dataset.productHandle)
      .then((product) => {
        this.productForm = new ProductForm(this.productFormElement, product, {
          onOptionChange: this._onFormOptionChange.bind(this),
          onFormSubmit: this._onFormSubmit.bind(this),
          onQuantityChange: this._onQuantityChange.bind(this),
        });
        this._setupEventListeners();
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  destroy() {
    const hasGallery = Boolean(this.gallery);
    const hasQuantitySelector = Boolean(
      this.container.dataset.showQuantitySelector
    );

    if (!hasGallery && !hasQuantitySelector) return;

    if (hasGallery) this.gallery.destroy();

    if (hasQuantitySelector) {
      this.quantitySelectors.forEach((quantitySelector) => {
        quantitySelector.removeEventListener(
          'click',
          this.eventHandlers.onQuantitySelectorClick
        );
      });
    }
  }

  _setupEventListeners() {
    if (!this.container.dataset.showQuantitySelector) return;

    this.eventHandlers.onQuantitySelectorClick = this._onQuantitySelectorClick.bind(
      this
    );

    this.quantitySelectors = this.container.querySelectorAll(
      selectors$8.quantitySelectors
    );

    this.quantitySelectors.forEach((quantitySelector) => {
      quantitySelector.addEventListener(
        'click',
        this.eventHandlers.onQuantitySelectorClick
      );
    });
  }

  _prepareGallery() {
    this.galleryElement = this.container.querySelector(selectors$8.media);
    if (!this.galleryElement) return;

    if (this.container.dataset.mediaType === 'gallery') {
      this._initializeGallery();
      return;
    }

    this._addGalleryMediaQueryListener();

    if (this.galleryMediaQueryListener.matches) {
      this._initializeGallery();
      this.gallery.addAccessibilityAttr();
      return;
    }

    this._loadAllGalleryImages();
  }

  _addGalleryMediaQueryListener() {
    this.galleryMediaQueryListener = window.matchMedia(
      getMediaQueryString('large', 'max')
    );

    this.galleryMediaQueryListener.addListener((event) => {
      if (event.matches) {
        this._switchToGalleryMode();
        return;
      }

      this._switchToStackedMode();
    });
  }

  _switchToGalleryMode() {
    const galleryWasJustInitialized = this._initializeGallery();
    this.gallery.state.useAriaHidden = true;
    this.gallery.hideMedia();
    this.gallery.addAccessibilityAttr();

    if (galleryWasJustInitialized) return;

    this.gallery.bindEvents();
  }

  _switchToStackedMode() {
    this._loadAllGalleryImages();
    this.gallery.removeAccessibilityAttr();
    this.gallery.resetTransformation();
    this.gallery.state.useAriaHidden = false;
    this.gallery.destroy();
  }

  _initializeGallery() {
    if (this.gallery) {
      this.gallery.applyTransformation();
      window.setTimeout(() => this.gallery.enableTransition());
      return false;
    }

    this.gallery = new Gallery(this.galleryElement);
    this.gallery.init();
    return true;
  }

  _loadAllGalleryImages() {
    const images = this.container.querySelectorAll(selectors$8.singleMedia);

    images.forEach((image) => {
      if (!image.getAttribute('src')) {
        image.setAttribute('src', image.getAttribute('data-src'));
      }

      if (!image.getAttribute('srcset')) {
        image.setAttribute('srcset', image.getAttribute('data-srcset'));
      }

      // eslint-disable-next-line no-self-assign
      image.outerHTML = image.outerHTML;
    });

    if (this.gallery) {
      this.gallery.elements.images = Array.from(
        this.gallery.elements.container.querySelectorAll(selectors$8.singleMedia)
      );
    }
  }

  _getProductJSON(handle) {
    const themeRoot = theme.rootUrl === '/' ? '' : theme.rootUrl;

    return window
      .fetch(`${themeRoot}/products/${handle}.js`)
      .then((response) => {
        return response.json();
      });
  }

  _onFormSubmit(event) {
    event.preventDefault();
    const addToCart = this.container.querySelector(selectors$8.addToCart);

    if (addToCart.hasAttribute('aria-disabled')) return;

    if (this._quantityIsInvalid()) return;

    this._addItemToCart();
  }

  _quantityIsInvalid() {
    const quantityInput = this.container.querySelector(selectors$8.quantityInput);

    if (
      quantityInput &&
      (parseInt(quantityInput.value, 10) <= 0 || quantityInput.value === '')
    ) {
      this._showErrorMessage(theme.strings.quantityMinimumMessage);
      return true;
    }

    return false;
  }

  _addItemToCart() {
    this._hideErrorMessage();
    this._hideSuccessMessage();

    const productId = this.productFormElement.dataset.productId;
    addItemFromForm(this.productFormElement)
      .then(() => {
        this._showSuccessMessage();
        this._getCartPrice();

        window.carts.forEach((cart) => {
          cart.onNewItemAdded(productId);
        });
      })
      .catch((error) => {
        this._handleProductError(error);
      });
  }

  _showSuccessMessage() {
    this.successMessage.classList.remove(classes$8.hidden);
    this.successMessage.focus();
  }

  _hideSuccessMessage() {
    this.successMessage =
      this.successMessage ||
      this.container.querySelector(selectors$8.productSuccessMessage);

    this.successMessage.classList.add(classes$8.hidden);
  }

  _getCartPrice() {
    getState()
      .then((cart) => {
        this._updateCartPriceBubble(cart.total_price);
        this._updateCartCountBubble(cart.item_count);
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  _updateCartPriceBubble(price) {
    const cartPriceBubble = document.querySelector(selectors$8.cartPriceBubble);

    cartPriceBubble.innerText = this._formatMoney(price);
  }

  _updateCartCountBubble(itemCount) {
    this.cartCountBubbles =
      this.cartCountBubbles ||
      document.querySelectorAll(selectors$8.cartCountBubble);
    this.cartCounts =
      this.cartCounts || document.querySelectorAll(selectors$8.cartCount);

    this.cartCounts.forEach(
      (cartCount) => (cartCount.innerText = itemCount > 99 ? '99+' : itemCount)
    );
    this.cartCountBubbles.forEach((countBubble) =>
      countBubble.classList.toggle(classes$8.hidden, itemCount === 0)
    );
  }

  _handleProductError(error) {
    error
      .json()
      .then((message) => {
        const errorMessage = message.description
          ? message.description
          : theme.strings.cartError;

        this._showErrorMessage(errorMessage);
      })
      .catch((message) => {
        throw message;
      });
  }

  _showErrorMessage(errorMessage) {
    const errorMessageWrapper = this.container.querySelector(
      selectors$8.errorMessageWrapper
    );
    const errorMessageElement = this.container.querySelector(
      selectors$8.errorMessage
    );

    const quantityInputWrapper = this.container.querySelector(
      selectors$8.quantityInputWrapper
    );

    errorMessageElement.innerText = errorMessage;

    if (quantityInputWrapper)
      quantityInputWrapper.classList.add(classes$8.formInputError);

    errorMessageWrapper.classList.remove(classes$8.hidden);
    errorMessageWrapper.setAttribute('aria-hidden', true);
    errorMessageWrapper.removeAttribute('aria-hidden');
  }

  _hideErrorMessage() {
    const errorMessageWrapper = this.container.querySelector(
      selectors$8.errorMessageWrapper
    );
    const quantityInputWrapper = this.container.querySelector(
      selectors$8.quantityInputWrapper
    );

    errorMessageWrapper.classList.add(classes$8.hidden);

    if (quantityInputWrapper)
      quantityInputWrapper.classList.remove(classes$8.formInputError);
  }

  _onFormOptionChange(event) {
    const variant = event.dataset.variant;

    this._updateMasterSelect(variant);
    this._hideErrorMessage();
    this._hideSuccessMessage();
    this._updatePrice(variant);
    this._updateProductPolicies(variant);
    this._updateAddToCart(variant);
    this._updateLiveRegion(variant);
    if (!variant.featured_media || !this.gallery) return;
    this.gallery.variantMediaSwitch(variant.featured_media.id);

    if (this.galleryMediaQueryListener) {
      if (this.galleryMediaQueryListener.matches) return;

      this.gallery.resetTransformation();
    }
  }

  _updateMasterSelect(variant) {
    if (!variant) return;

    this.masterSelect =
      this.masterSelect ||
      this.container.querySelector(selectors$8.productMasterSelect);

    this.masterSelect.value = variant.id;
  }

  _onQuantityChange() {
    this._hideErrorMessage();
    this._hideSuccessMessage();
  }

  _onQuantitySelectorClick(event) {
    this._hideErrorMessage();
    const quantityInput = this.container.querySelector(selectors$8.quantityInput);
    const currentQuantity = parseInt(quantityInput.value, 10);
    const newQuantity = this._calculateNewInputQuantity(
      event.currentTarget,
      currentQuantity
    );

    quantityInput.value = newQuantity;
  }

  _calculateNewInputQuantity(quantitySelector, currentQuantity) {
    const isIncrement = quantitySelector.hasAttribute(
      attributes$1.dataQuantitySelectorIncrease
    );

    const result = isIncrement ? currentQuantity + 1 : currentQuantity - 1;

    return Math.max(1, result);
  }

  _updatePrice(variant) {
    this.priceContainer =
      this.priceContainer || this.container.querySelector(selectors$8.price);

    this.priceContainer.classList.remove(
      classes$8.productUnavailable,
      classes$8.productOnSale,
      classes$8.productUnitAvailable,
      classes$8.productSoldOut
    );
    this.priceContainer.removeAttribute('aria-hidden');

    // product unavailable
    if (!variant) {
      this.priceContainer.classList.add(classes$8.productUnavailable);
      this.priceContainer.setAttribute('aria-hidden', true);
      return;
    }

    // Sold out
    if (!variant.available) {
      this.priceContainer.classList.add(classes$8.productSoldOut);
    }

    // on sale
    if (variant.compare_at_price > variant.price) {
      this._renderOnSalePrice(variant);
    } else {
      this._renderRegularPrice(variant);
    }

    this._updateUnitPrice(variant);
  }

  _renderOnSalePrice(variant) {
    const regularPrice = this.priceContainer.querySelectorAll(
      selectors$8.regularPrice
    );
    const salePrice = this.priceContainer.querySelector(selectors$8.salePrice);

    regularPrice.forEach((price) => {
      price.innerText = this._formatMoney(variant.compare_at_price);
    });

    salePrice.innerText = this._formatMoney(variant.price);
    this.priceContainer.classList.add(classes$8.productOnSale);
  }

  _renderRegularPrice(variant) {
    const regularPrice = this.priceContainer.querySelectorAll(
      selectors$8.regularPrice
    );

    regularPrice.forEach((price) => {
      price.innerText = this._formatMoney(variant.price);
    });
  }

  _updateUnitPrice(variant) {
    if (!variant.unit_price) return;

    const unitPrice = this.priceContainer.querySelector(selectors$8.unitPrice);
    const unitPriceBaseUnit = this.priceContainer.querySelector(
      selectors$8.unitPriceBaseUnit
    );

    unitPrice.innerText = this._formatMoney(
      variant.unit_price,
      theme.moneyFormat
    );
    unitPriceBaseUnit.innerText = this._getBaseUnit(variant);
    this.priceContainer.classList.add(classes$8.productUnitAvailable);
  }

  _getBaseUnit(variant) {
    return variant.unit_price_measurement.reference_value === 1
      ? variant.unit_price_measurement.reference_unit
      : variant.unit_price_measurement.reference_value +
          variant.unit_price_measurement.reference_unit;
  }

  _updateProductPolicies(variant) {
    const productPolicies = this.container.querySelector(
      selectors$8.productPolicies
    );

    if (!productPolicies) return;

    productPolicies.classList.remove(classes$8.visuallyHidden);

    if (!variant) productPolicies.classList.add(classes$8.visuallyHidden);
  }

  _updateAddToCart(variant) {
    const addToCart = this.container.querySelector(selectors$8.addToCart);
    const addToCartText = this.container.querySelector(selectors$8.addToCartText);

    if (!variant) {
      addToCart.setAttribute('aria-disabled', true);
      addToCart.setAttribute('aria-label', theme.strings.unavailable);
      addToCartText.innerText = theme.strings.unavailable;
    } else if (variant.available) {
      addToCart.removeAttribute('aria-disabled');
      addToCart.setAttribute('aria-label', theme.strings.addToCart);
      addToCartText.innerText = theme.strings.addToCart;
    } else {
      addToCart.setAttribute('aria-disabled', true);
      addToCart.setAttribute('aria-label', theme.strings.soldOut);
      addToCartText.innerText = theme.strings.soldOut;
    }
  }

  _updateLiveRegion(variant) {
    const productStatus = this.container.querySelector(selectors$8.productStatus);

    productStatus.innerText = this._getLiveRegionText(variant);
    productStatus.setAttribute('aria-hidden', false);

    // hide content from accessibility tree after announcement
    setTimeout(() => {
      productStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }

  _formatMoney(price) {
    return formatMoney(price, theme.moneyFormat);
  }

  _getLiveRegionText(variant) {
    if (!variant) return theme.strings.unavailable;

    const isOnSale = variant.compare_at_price > variant.price;

    const availability = variant.available ? '' : theme.strings.soldOut;

    let regularPriceLabel = '';
    let regularPrice = this._formatMoney(variant.price);

    let salePriceLabel = '';
    let salePrice = '';

    let unitPriceLabel = '';
    let unitPrice = '';

    if (isOnSale) {
      regularPriceLabel = theme.strings.regularPrice;
      regularPrice = this._formatMoney(variant.compare_at_price);

      salePriceLabel = theme.strings.salePrice;
      salePrice = this._formatMoney(variant.price);
    }

    if (variant.unit_price) {
      unitPriceLabel = theme.strings.unitPrice;
      unitPrice = `${this._formatMoney(variant.unit_price)} ${
        theme.strings.unitPriceSeparator
      } ${this._getBaseUnit(variant)}`;
    }

    return `${availability} ${regularPriceLabel} ${regularPrice} ${salePriceLabel} ${salePrice} ${unitPriceLabel} ${unitPrice}`;
  }
}

sections.register('product', {
  onLoad() {
    this.product = new Product(this.container);
  },

  onUnload() {
    this.product.destroy();
  },
});

const selectors$12 = {
  stickyElement: '[data-sticky-element]',
  stickySentinelTop: '[data-sticky-sentinel-top]',
  stickySentinelBottom: '[data-sticky-sentinel-bottom]',
};

const classes$11 = {
  stickyContainer: 'sticky__container',
  stickySentinel: 'sticky__sentinel',
  stickySentinelTop: 'sticky__sentinel--top',
  stickySentinelBottom: 'sticky__sentinel--bottom',
  stickyElement: 'sticky__element',
};

class StickyElement {
  constructor(container) {
    this.container = container;
  }

  init() {
    if (!this.isBrowserCompatible()) return;

    this.stickyElement = this.container.querySelector(selectors$12.stickyElement);
    if (!this.stickyElement) return;

    this.sticky = false;
    this._addSentinels();
    this._observeTopSentinel();
    this._observeBottomSentinel();
  }

  destroy() {
    if (this.topObserver) this.topObserver.disconnect();
    if (this.bottomObserver) this.bottomObserver.disconnect();
  }

  isBrowserCompatible() {
    if (
      'IntersectionObserver' in window &&
      'IntersectionObserverEntry' in window &&
      'intersectionRatio' in window.IntersectionObserverEntry.prototype
    ) {
      return true;
    }
    return false;
  }

  isSticky() {
    return this.sticky;
  }

  _addSentinels() {
    const sentinelTop = document.createElement('div');
    sentinelTop.classList.add(
      classes$11.stickySentinel,
      classes$11.stickySentinelTop
    );
    sentinelTop.dataset.stickySentinelTop = '';

    this.container.classList.add(classes$11.stickyContainer);

    this.stickyElement.insertAdjacentElement('beforebegin', sentinelTop);

    const sentinelBottom = document.createElement('div');
    sentinelBottom.classList.add(
      classes$11.stickySentinel,
      classes$11.stickySentinelBottom
    );
    sentinelBottom.dataset.stickySentinelBottom = '';

    this.stickyElement.parentElement.appendChild(sentinelBottom);
  }

  _observeTopSentinel() {
    const topSentinel = this.container.querySelector(
      selectors$12.stickySentinelTop
    );
    if (!topSentinel) return;

    this.topObserver = new IntersectionObserver((records) => {
      records.forEach((record) => {
        const targetInfo = record.boundingClientRect;
        const rootBoundsInfo = record.rootBounds;

        const startedSticking = targetInfo.bottom < rootBoundsInfo.top;
        const stoppedSticking =
          targetInfo.bottom >= rootBoundsInfo.top &&
          targetInfo.bottom < rootBoundsInfo.bottom;

        if (startedSticking) {
          this.sticky = true;
          this.stickyElement.classList.add(classes$11.stickyElement);
        }

        if (stoppedSticking) {
          this.sticky = false;
          this.stickyElement.classList.remove(classes$11.stickyElement);
        }
      });
    });

    this.topObserver.observe(topSentinel);
  }

  _observeBottomSentinel() {
    const bottomSentinel = this.container.querySelector(
      selectors$12.stickySentinelBottom
    );
    if (!bottomSentinel) return;

    let previousY = 0;
    this.bottomObserver = new IntersectionObserver((records) => {
      records.forEach((record) => {
        const targetInfo = record.boundingClientRect;
        const rootBoundsInfo = record.rootBounds;
        const ratio = record.intersectionRatio;
        const scrollingDown = previousY > record.boundingClientRect.y;
        previousY = record.boundingClientRect.y;

        const startedSticking =
          targetInfo.bottom > rootBoundsInfo.top && ratio === 1;
        const stoppedSticking =
          targetInfo.top < rootBoundsInfo.top &&
          targetInfo.bottom < rootBoundsInfo.bottom;

        if (!scrollingDown && startedSticking) {
          this.sticky = true;
          this.stickyElement.classList.add(classes$11.stickyElement);
        }

        if (stoppedSticking) {
          this.sticky = false;
          this.stickyElement.classList.remove(classes$11.stickyElement);
        }
      });
    });

    this.bottomObserver.observe(bottomSentinel);
  }
}

const selectors$13 = {
  viewMoreButton: '[data-view-more-button]',
  viewMoreItem: '[data-view-more-item]',
  viewMoreStatus: '[data-view-more-status]',
};

const classes$12 = {
  hidden: 'hidden',
};

const events = {
  success: 'viewmore_loaded',
};

class ViewMore {
  constructor(container) {
    this.container = container;
  }

  init() {
    if (!this.container) return;

    this.viewMoreButton = this.container.querySelector(
      selectors$13.viewMoreButton
    );
    if (!this.viewMoreButton) return;

    this.maxCount = parseInt(this.viewMoreButton.dataset.viewMoreMax, 10);
    this.countPerPage = parseInt(this.viewMoreButton.dataset.viewMoreStep, 10);
    this.currentCount = parseInt(
      this.viewMoreButton.dataset.viewMoreCurrent,
      10
    );
    this.isLoading = false;
    this._setupEventHandlers();
  }

  _getEventHandlers() {
    return {
      onClickViewMoreHandler: this._onClickViewMoreHandler.bind(this),
    };
  }

  _setupEventHandlers() {
    this.eventHandlers = this._getEventHandlers();

    this.viewMoreButton.addEventListener(
      'click',
      this.eventHandlers.onClickViewMoreHandler
    );
  }

  _onClickViewMoreHandler() {
    this._loadItems();
  }

  _getNextPage() {
    const nextPage = Math.floor(this.currentCount / this.countPerPage) + 1;
    const url = this.viewMoreButton.dataset.viewMoreNext.replace(
      '[pagination]',
      nextPage
    );

    return url;
  }

  _fireEvent(eventName, data) {
    this.container.dispatchEvent(
      new window.CustomEvent(eventName, {
        detail: data,
      })
    );
  }

  _loadItems() {
    if (this.isLoading || this.currentCount >= this.maxCount) return;

    const url = this._getNextPage();
    this.isLoading = true;
    fetch(url)
      .then((response) => response.text())
      .then((text) => {
        const parser = new DOMParser();
        return parser.parseFromString(text, 'text/html');
      })
      .then((html) => {
        const items = [...html.querySelectorAll(selectors$13.viewMoreItem)];

        if (this.currentCount < this.countPerPage) {
          items.splice(0, this.currentCount);
        }

        this.isLoading = false;
        this.currentCount += items.length;
        this._updateButton();
        this._updateLiveRegion();
        this._fireEvent(events.success, { items });
      })
      .then(() => {
        this._updateSPRBadges();
      })
      .catch((error) => {
        this.isLoading = false;
        throw new Error(error);
      });
  }

  _updateSPRBadges() {
    if (!window.SPR) return;

    if (window.SPR.initDomEls && window.SPR.loadBadges) {
      window.SPR.initDomEls();
      window.SPR.loadBadges();
    }
  }

  _updateButton() {
    this.viewMoreButton.dataset.viewMoreCurrent = this.currentCount;

    if (this.currentCount >= this.maxCount) {
      this.viewMoreButton.classList.add(classes$12.hidden);
    }
  }

  _updateLiveRegion() {
    const viewMoreStatus = this.container.querySelector(
      selectors$13.viewMoreStatus
    );
    const viewMoreStatusMessage = viewMoreStatus.dataset.viewMoreStatusMessage
      .replace('[item_count]', this.currentCount)
      .replace('[item_max]', this.maxCount);

    viewMoreStatus.innerText = viewMoreStatusMessage;
    viewMoreStatus.setAttribute('aria-hidden', false);

    // hide content from accessibility tree after announcement
    setTimeout(() => {
      viewMoreStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }
}

const selectors$11 = {
  scrollerContent: '[data-scroller-content]',
  featuredCollectionsTabs: '[data-featured-collections-tab]',
  featuredCollectionsSelectedTab: '[data-featured-collections-selected-tab]',
  featuredCollectionsTabsPanel: '[data-featured-collections-tab-panel]',
  featuredCollectionsWrapper: '[data-featured-collections-wrapper]',
  productCard: '[data-product-card]',
  productCollectionTitle: '[data-product-collection-title]',
  productImage: '[data-media-image]',
  productModalContent: '[data-product-modal-content]',
  productModalWrapper: '[data-product-modal-wrapper]',
  productTemplate: '[data-product-template]',
  productViewCartLink: '[data-product-view-cart-link]',
  viewMoreContent: '[data-view-more-content]',
};

const classes$10 = {
  featuredCollectionsPanelActive: 'featured-collections__panel--active',
  featuredCollectionsPanelVisible: 'featured-collections__panel--visible',
  featuredCollectionsTabActive: 'featured-collections-tab__item--active',
  productModalWrapperNoMedia: 'product-modal-wrapper--no-media',
};

sections.register('featured-collections', {
  onLoad() {
    this.tabs = this.container.querySelectorAll(
      selectors$11.featuredCollectionsTabs
    );

    this.scroller = new Scroller(this.container);
    this.scroller.init();

    this.stickyNav = new StickyElement(this.container);
    this.stickyNav.init();

    this.productModalEnabled = Boolean(this.container.dataset.productModal);

    this.productCards = [];
    if (this.productModalEnabled) {
      this.productCards = this.container.querySelectorAll(
        selectors$11.productCard
      );
    }

    this.tabsPanel = this.container.querySelectorAll(
      selectors$11.featuredCollectionsTabsPanel
    );

    this._setupEventHandlers();

    if (!theme.cartQuantity) return;

    theme.cartQuantity.updateQuantityIndicatorElements(false, this.container);
  },

  onUnload() {
    if (!this.tabs) return;

    this.stickyNav.destroy();
    this.scroller.destroy();
    this.tabs.forEach((tab) => {
      tab.removeEventListener('click', this.eventHandlers.onClickTabHandler);
      tab.removeEventListener(
        'keydown',
        this.eventHandlers.onKeyDownTabHandler
      );
    });
  },

  onBlockSelect(event) {
    if (this.container.dataset.singleCollection) return;

    const selectedBlock = this.container.querySelector(
      `[data-featured-collections-block-id="${event}"]`
    );

    if (!selectedBlock) return;
    const selectedTab = selectedBlock.dataset.featuredCollectionsTabNumber;
    this.showCollectionPanel(selectedTab);
  },

  _getEventHandlers() {
    return {
      onClickTabHandler: this.onClickTabHandler.bind(this),
      onKeyDownTabHandler: this.onKeyDownTabHandler.bind(this),
      onKeyUpTabHandler: this.onKeyUpTabHandler.bind(this),
      onViewMoreLoaded: this.onViewMoreLoaded.bind(this),
      onProductCardClick: this._onProductCardClick.bind(this),
      hideModalShowCart: this._hideModalShowCart.bind(this),
      hideProductModal: this._hideProductModal.bind(this),
    };
  },

  _setupProductCardListener(productCard) {
    productCard.addEventListener(
      'click',
      this.eventHandlers.onProductCardClick
    );
  },

  _onProductCardClick(event) {
    event.preventDefault();

    this._setupProductModal(event);
  },

  _setupProductModal(event) {
    this.productCard = event.currentTarget;
    const collectionTitle = this.container.querySelector(
      selectors$11.featuredCollectionsSelectedTab
    ).dataset.collectionTitle;
    const productUrl = this.productCard.dataset.productUrl;

    this._getProductModalContent(productUrl)
      .then((productTemplate) => {
        this._setupProductModalContent(productTemplate, collectionTitle);
        this._showProductModal(productTemplate);
        this._updateSPRReviews();
      })
      .catch((error) => {
        throw new Error(error);
      });
  },

  _updateSPRReviews() {
    if (!window.SPR) return;

    if (window.SPR.initDomEls && window.SPR.loadProducts) {
      window.SPR.initDomEls();
      window.SPR.loadProducts();
    }
  },

  _getProductModalContent(productUrl) {
    return fetch(productUrl)
      .then((response) => response.text())
      .then((text) => {
        const parser = new DOMParser();
        return parser.parseFromString(text, 'text/html');
      })
      .then((productHtml) => {
        return productHtml.querySelector(selectors$11.productTemplate);
      })
      .catch((error) => {
        throw new Error(error);
      });
  },

  _setupProductModalListener() {
    this.productCard.addEventListener(
      'popup_closed',
      this.eventHandlers.hideProductModal
    );

    this.viewCart = this.productModalContent.querySelector(
      selectors$11.productViewCartLink
    );

    if (!this.viewCart) return;

    this.viewCart.addEventListener(
      'click',
      this.eventHandlers.hideModalShowCart
    );
  },

  _setupProductModalContent(productTemplate, collectionTitle) {
    this.productModal =
      this.productModal ||
      document.querySelector(selectors$11.productModalWrapper);
    this.productModalContent =
      this.productModalContent ||
      this.productModal.querySelector(selectors$11.productModalContent);

    const productCollectionTitles = productTemplate.querySelectorAll(
      selectors$11.productCollectionTitle
    );

    if (!this._productHasNoMedia(productTemplate))
      this.productModal.classList.add(classes$10.productModalWrapperNoMedia);

    productCollectionTitles.forEach((productCollectionTitle) => {
      productCollectionTitle.textContent = collectionTitle;
    });

    this.productModalContent.appendChild(productTemplate);

    this.productModalContent
      .querySelectorAll(selectors$11.productImage)
      /* eslint-disable-next-line no-self-assign */
      .forEach((image) => (image.outerHTML = image.outerHTML));

    this._setupProductModalListener();
  },

  _productHasNoMedia(productTemplate) {
    return productTemplate.querySelectorAll(selectors$11.productImage).length;
  },

  _showProductModal(productTemplate) {
    this.product = new Product(productTemplate);

    this.productPopup =
      this.productPopup ||
      window.popups.find((popup) => popup.name === 'product-modal');

    if (window.Shopify && Shopify.PaymentButton) {
      Shopify.PaymentButton.init();
    }

    this.productPopup.openPopup({ currentTarget: this.productCard });
  },

  _hideModalShowCart(event) {
    event.preventDefault();

    this.cartPopup =
      this.cartPopup || window.popups.find((popup) => popup.name === 'cart');

    this.productPopup.closePopup();
    this.cartPopup.openPopup({
      currentTarget: this.productPopup.elements.triggerNode,
    });

    this._hideProductModal();

    if (!this.viewCart) return;

    this.viewCart.removeEventListener(
      'click',
      this.eventHandlers.hideModalShowCart
    );
  },

  _hideProductModal() {
    this.productModalContent.innerHTML = '';
    this.productModal.classList.remove(classes$10.productModalWrapperNoMedia);
    this.product.destroy();

    this.productCard.removeEventListener(
      'popup_closed',
      this.eventHandlers.hideProductModal
    );
  },

  _setupEventHandlers() {
    this.eventHandlers = this._getEventHandlers();

    this.productCards.forEach((productCard) =>
      this._setupProductCardListener(productCard)
    );

    this.tabsPanel.forEach((tabPanel) => {
      if (!tabPanel.dataset.viewMore) return;

      const viewMore = new ViewMore(tabPanel);
      viewMore.init();
      tabPanel.addEventListener(
        'viewmore_loaded',
        this.eventHandlers.onViewMoreLoaded
      );
    });

    if (!this.tabs || this.container.dataset.singleCollection) return;

    this.tabs.forEach((tab) => {
      tab.addEventListener('click', this.eventHandlers.onClickTabHandler);
      tab.addEventListener('keydown', this.eventHandlers.onKeyDownTabHandler);
      tab.addEventListener('keyup', this.eventHandlers.onKeyUpTabHandler);
    });
  },

  onViewMoreLoaded(event) {
    const newProducts = event.detail.items;
    // need to check if the target is the view more button
    const viewMoreContainer = event.target;

    const viewMoreContent = viewMoreContainer.querySelector(
      selectors$11.viewMoreContent
    );

    const newProductIds = [];
    newProducts.forEach((product, index) => {
      const newProductCard = product.querySelector(selectors$11.productCard);
      newProductIds.push(newProductCard.dataset.productId);

      const newItem = viewMoreContent.appendChild(product);
      if (index === 0) newItem.querySelector('a').focus();

      if (!this.productModalEnabled) return;
      this._setupProductCardListener(newProductCard);
    });

    theme.cartQuantity.updateQuantityIndicatorElements(
      newProductIds,
      this.viewMoreContent
    );
  },

  /**
   * Keyboard event callback
   * Make the tab list keyboard navigation friendly with Home, End, Left arrow, Right arrow keys
   * @param {Object} event Event object
   */
  onKeyDownTabHandler(event) {
    const preventKeys = [
      keyCodes.HOME,
      keyCodes.END,
      keyCodes.RIGHT,
      keyCodes.LEFT,
    ];

    if (preventKeys.includes(event.key.toLowerCase())) {
      event.preventDefault();
    }
  },

  /**
   * Keyboard event callback
   * Make the tab list keyboard navigation friendly with Home, End, Left arrow, Right arrow keys
   * @param {Object} event Event object
   */
  onKeyUpTabHandler(event) {
    const currentElement = event.currentTarget;
    const lastElementIndex = this.tabs.length - 1;
    const currentElementIndex = Number(
      currentElement.dataset.featuredCollectionsTabNumber
    );

    let index = -1;
    switch (event.key.toLowerCase()) {
      case keyCodes.HOME: {
        index = 0;
        break;
      }
      case keyCodes.END: {
        index = lastElementIndex;
        break;
      }
      case keyCodes.RIGHT: {
        index =
          currentElementIndex === lastElementIndex
            ? 0
            : currentElementIndex + 1;
        break;
      }
      case keyCodes.LEFT: {
        index =
          currentElementIndex === 0
            ? lastElementIndex
            : currentElementIndex - 1;
        break;
      }
    }

    if (index !== -1 && currentElementIndex !== index) {
      event.preventDefault();
      this.showCollectionPanel(index);
    }
  },

  onClickTabHandler(event) {
    const index = event.currentTarget.dataset.featuredCollectionsTabNumber;
    this.showCollectionPanel(index);
  },

  /**
   * Show the correct tabpanel, adjust the aria attributes and classes accordingly
   * @param {Number} index The position of the tabpanel
   */
  showCollectionPanel(index) {
    const targetTab = this.tabs[index];
    const panelWrapper = this.container.querySelector(
      selectors$11.featuredCollectionsWrapper
    );

    const offsetPosition =
      panelWrapper.getBoundingClientRect().top + window.pageYOffset - 105;

    if (this.stickyNav.isSticky()) {
      window.scrollTo({
        top: offsetPosition,
      });
    }

    this.tabs.forEach((tab) => {
      tab.classList.remove(classes$10.featuredCollectionsTabActive);
      tab.setAttribute('aria-selected', false);
      tab.setAttribute('tabindex', -1);
      delete tab.dataset.featuredCollectionsSelectedTab;
      tab.blur();
    });

    targetTab.classList.add(classes$10.featuredCollectionsTabActive);
    targetTab.setAttribute('aria-selected', true);
    targetTab.setAttribute('tabindex', 0);
    targetTab.dataset.featuredCollectionsSelectedTab = true;
    targetTab.focus();

    this.scroller.makeElementVisible(targetTab);

    const targetPanel = this.tabsPanel[index];
    if (!targetPanel) return;

    this.tabsPanel.forEach((tabPanel) => {
      tabPanel.classList.remove(classes$10.featuredCollectionsPanelVisible);
      tabPanel.classList.remove(classes$10.featuredCollectionsPanelActive);
    });

    targetPanel.classList.add(classes$10.featuredCollectionsPanelActive);
    window.requestAnimationFrame(() =>
      targetPanel.classList.add(classes$10.featuredCollectionsPanelVisible)
    );
  },
});

const selectors$14 = {
  blogTagFilter: '[data-blog-tag-filter]',
};

(() => {
  const blogTagFilter = document.querySelector(selectors$14.blogTagFilter);

  if (!blogTagFilter) return;

  resizeSelectInput(blogTagFilter);

  blogTagFilter.addEventListener('change', (event) => {
    location.href = event.target.value;
  });
})();

const selectors$15 = {
  passwordButton: '[data-password-button]',
  passwordInput: '[data-password-input]',
};

const attributes$2 = {
  error: 'data-error',
  templatePassword: 'data-template-password',
};

(() => {
  const isPasswordTemplate = document.body.hasAttribute(
    attributes$2.templatePassword
  );

  if (!isPasswordTemplate) return;

  const passwordInput = document.querySelector(selectors$15.passwordInput);

  if (passwordInput.hasAttribute(attributes$2.error)) {
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        showPasswordModal();
      }, 50);
    });
  }

  function showPasswordModal() {
    const passwordModal = window.popups.find(
      (popup) => popup.name === 'password-modal'
    );

    passwordModal.openPopup({
      currentTarget: document.querySelector(selectors$15.passwordButton),
    });
  }
})();

const selectors$16 = {
  addNewAddressToggle: '[data-add-new-address-toggle]',
  addressCountrySelect: '[data-address-country-select]',
  addressFormNew: '[data-address-form-new]',
  cancelEditAddressToggle: '[data-cancel-edit-address-toggle]',
  cancelNewAddressToggle: '[data-cancel-new-address-toggle]',
  customerAddresses: '[data-customer-addresses]',
  deleteAddressButton: '[data-delete-address-button]',
  editAddressToggle: '[data-edit-address-toggle]',
  editAddressId: (id) => `[data-edit-address-id="${id}"]`,
  form: '[data-form]',
};

const attributes$3 = {
  addNewAddressToggle: 'data-add-new-address-toggle',
};

const classes$13 = {
  hidden: 'hidden',
};

(() => {
  const container = document.querySelector(selectors$16.customerAddresses);

  if (!container) return;

  const newAddressForm = container.querySelector(selectors$16.addressFormNew);

  if (!newAddressForm) return;

  _setupCountries();

  _setupEventListeners();

  function _setupEventListeners() {
    const addNewAddressToggle = container.querySelector(
      selectors$16.addNewAddressToggle
    );

    const cancelNewAddressToggle = container.querySelector(
      selectors$16.cancelNewAddressToggle
    );

    const editAddressToggles = container.querySelectorAll(
      selectors$16.editAddressToggle
    );
    const cancelEditAddressToggles = container.querySelectorAll(
      selectors$16.cancelEditAddressToggle
    );

    const deleteAddressButtons = container.querySelectorAll(
      selectors$16.deleteAddressButton
    );

    addNewAddressToggle.addEventListener('click', (event) =>
      _toggleAddNewAddressForm(event, addNewAddressToggle, newAddressForm)
    );

    cancelNewAddressToggle.addEventListener('click', (event) =>
      _toggleAddNewAddressForm(event, addNewAddressToggle, newAddressForm)
    );

    editAddressToggles.forEach((editAddressToggle) =>
      editAddressToggle.addEventListener('click', (event) =>
        _toggleEditAddressForm(event, editAddressToggles)
      )
    );

    cancelEditAddressToggles.forEach((cancelEditAddressToggle) =>
      cancelEditAddressToggle.addEventListener('click', () => {
        _toggleEditAddressForm(event, editAddressToggles);
      })
    );

    deleteAddressButtons.forEach((deleteButton) =>
      deleteButton.addEventListener('click', _deleteAddress)
    );
  }

  function _setupCountries() {
    // Initialize observers on address selectors, defined in shopify_common.js
    if (Shopify) {
      // eslint-disable-next-line no-new
      new Shopify.CountryProvinceSelector(
        'AddressCountryNew',
        'AddressProvinceNew',
        {
          hideElement: 'AddressProvinceContainerNew',
        }
      );
    }

    // Initialize each edit form's country/province selector
    container
      .querySelectorAll(selectors$16.addressCountrySelect)
      .forEach((countrySelect) => {
        const formId = countrySelect.dataset.formId;
        const countrySelector = `AddressCountry_${formId}`;
        const provinceSelector = `AddressProvince_${formId}`;
        const containerSelector = `AddressProvinceContainer_${formId}`;

        // eslint-disable-next-line no-new
        new Shopify.CountryProvinceSelector(countrySelector, provinceSelector, {
          hideElement: containerSelector,
        });
      });
  }

  function _toggleAddNewAddressForm(
    event,
    addNewAddressToggle,
    // eslint-disable-next-line no-shadow
    newAddressForm
  ) {
    const button = event.currentTarget;
    const newAddressFormExpandedState = addNewAddressToggle.getAttribute(
      'aria-expanded'
    );

    if (newAddressFormExpandedState === 'false') {
      newAddressForm.classList.remove(classes$13.hidden);
      addNewAddressToggle.setAttribute('aria-expanded', true);
    } else {
      newAddressForm.classList.add(classes$13.hidden);
      addNewAddressToggle.setAttribute('aria-expanded', false);
    }

    if (button.hasAttribute(attributes$3.addNewAddressToggle)) return;
    addNewAddressToggle.focus();
  }

  function _toggleEditAddressForm(event, editAddressToggles) {
    const button = event.currentTarget;
    const addressId = button.dataset.addressId;
    const editAddressformContainer = container.querySelector(
      selectors$16.editAddressId(addressId)
    );
    const editButton = Array.from(editAddressToggles).find(
      (editAddressToggle) => editAddressToggle.dataset.addressId === addressId
    );

    if (editButton.getAttribute('aria-expanded') === 'false') {
      editAddressformContainer.classList.remove(classes$13.hidden);
      editButton.setAttribute('aria-expanded', true);
    } else {
      editAddressformContainer.classList.add(classes$13.hidden);
      editButton.setAttribute('aria-expanded', false);
    }

    if (button.hasAttribute(attributes$3.editAddressFormToggle)) return;
    editButton.focus();
  }

  function _deleteAddress(event) {
    const deleteButton = event.currentTarget;
    const target = deleteButton.dataset.target;
    const confirmMessage =
      deleteButton.dataset.confirmMessage ||
      'Are you sure you wish to delete this address?';

    // eslint-disable-next-line no-alert
    if (confirm(confirmMessage)) {
      Shopify.postLink(target, {
        parameters: { _method: 'delete' },
      });
    }
  }
})();

const selectors$17 = {
  cancelResetPasswordLink: '[data-cancel-reset-password-link]',
  customerLogin: '[data-customer-login]',
  loginContainer: '[data-login-container]',
  loginHeading: '[data-login-heading]',
  resetPasswordHeading: '[data-reset-password-heading]',
  resetPasswordLink: '[data-reset-password-link]',
  resetPasswordContainer: '[data-reset-password-container]',
  resetPasswordSuccess: '[data-reset-password-success]',
  resetPasswordSuccessMessage: '[data-reset-password-success-message]',
};

const classes$14 = {
  hidden: 'hidden',
};

(() => {
  const container = document.querySelector(selectors$17.customerLogin);

  if (!container) return;

  _checkUrlHash();
  _resetPasswordOnSuccess();
  _setupEventHandlers();

  function _setupEventHandlers() {
    const resetPasswordLink = container.querySelector(
      selectors$17.resetPasswordLink
    );

    const cancelResetPasswordLink = container.querySelector(
      selectors$17.cancelResetPasswordLink
    );

    resetPasswordLink.addEventListener('click', (event) => {
      event.preventDefault();

      const resetPasswordHeading = container.querySelector(
        selectors$17.resetPasswordHeading
      );
      _handleContainers(resetPasswordHeading, true);
    });

    cancelResetPasswordLink.addEventListener('click', (event) => {
      event.preventDefault();

      const loginHeading = container.querySelector(selectors$17.loginHeading);
      _handleContainers(loginHeading, false);
    });
  }

  function _checkUrlHash() {
    const hash = window.location.hash;

    // Allow deep linking to recover password form
    if (hash === '#recover') {
      const resetPasswordHeading = container.querySelector(
        selectors$17.resetPasswordHeading
      );

      _handleContainers(resetPasswordHeading, true);
    }
  }

  function _resetPasswordOnSuccess() {
    const resetPasswordStatus = container.querySelector(
      selectors$17.resetPasswordSuccess
    );
    const resetPasswordMessage = container.querySelector(
      selectors$17.resetPasswordSuccessMessage
    );

    if (!resetPasswordStatus) return;

    resetPasswordMessage.classList.remove(classes$14.hidden);
    resetPasswordMessage.focus();
  }

  function _handleContainers(containerHeading, showPasswordPage) {
    const loginContainer = container.querySelector(selectors$17.loginContainer);
    const resetPasswordContainer = container.querySelector(
      selectors$17.resetPasswordContainer
    );

    if (showPasswordPage) {
      loginContainer.classList.add(classes$14.hidden);
      resetPasswordContainer.classList.remove(classes$14.hidden);
    } else {
      loginContainer.classList.remove(classes$14.hidden);
      resetPasswordContainer.classList.add(classes$14.hidden);
    }

    containerHeading.setAttribute('tabindex', '-1');
    containerHeading.focus();

    containerHeading.addEventListener('blur', () => {
      containerHeading.removeAttribute('tabindex');
    });
  }
})();

// import components
// import sections
// import templates
window.addEventListener('DOMContentLoaded', () => {
  // eslint-disable-next-line no-new
  new Form();

  sections.load('*');

  window.carts = Array.from(
    document.querySelectorAll('[data-cart]'),
    (cart) => {
      const currentCart = new Cart(cart);
      currentCart.init();
      return currentCart;
    }
  );

  window.popups = Array.from(
    document.querySelectorAll('[data-popup]'),
    (popup) => {
      const currentPopup = new Popup(popup.dataset.popup);
      currentPopup.init();
      return currentPopup;
    }
  );

  _shopify_themeA11y.accessibleLinks('a[href]:not([aria-describedby]', {
    messages: {
      newWindow: theme.strings.newWindow,
      external: theme.strings.external,
      newWindowExternal: theme.strings.newWindowExternal,
    },
  });

  theme.cartQuantity = new CartQuantity();
  theme.cartQuantity.updateLocalCartState();

  const cartTemplate = document.querySelector('[data-cart-template]');

  if (cartTemplate) {
    const cart = new CartTemplate(cartTemplate);
    cart.init();
  }
});

}(Shopify.theme.sections,Shopify.theme.a11y));
