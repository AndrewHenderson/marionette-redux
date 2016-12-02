// Marionette Redux
// ----------------------------------
// v0.1.3
//
// Copyright (c)2016 Andrew Henderson.
// Distributed under MIT license


(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('underscore'), require('marionette')) :
  typeof define === 'function' && define.amd ? define(['exports', 'underscore', 'marionette'], factory) :
  (factory((global.MarionetteRedux = global.MarionetteRedux || {}),global._,global.Marionette));
}(this, (function (exports,_,Marionette) { 'use strict';

_ = 'default' in _ ? _['default'] : _;
Marionette = 'default' in Marionette ? Marionette['default'] : Marionette;

var defaultMapStateToProps = (function (state) {
  return {};
});

var defaultMapDispatchToProps = (function (dispatch) {
  return { dispatch: dispatch };
});

var defaultMergeProps = (function (stateProps, dispatchProps, parentProps) {
  return _.extend({}, parentProps, stateProps, dispatchProps);
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var setState = function (key, val, options) {

  if (key == null) {
    return this;
  }

  // Handle both `"key", value` and `{key: value}` -style arguments.
  var state = void 0;
  if ((typeof key === 'undefined' ? 'undefined' : _typeof(key)) === 'object') {
    state = key;
    options = val;
  } else {
    (state = {})[key] = val;
  }

  options || (options = {});

  // Extract state and options.
  var unset = options.unset;
  var silent = options.silent;
  var changes = [];
  var changing = this._changing;
  this._changing = true;

  if (!changing) {
    this._previousState = _.clone(this.state);
    this.changed = {};
  }

  var current = this.state;
  var changed = this.changed;
  var prev = this._previousState;

  // For each `set` state, update or delete the current value.
  _.each(state, function (_val, _key) {
    if (!_.isEqual(current[_key], _val)) {
      changes.push(_key);
    }
    if (!_.isEqual(prev[_key], _val)) {
      changed[_key] = _val;
    } else {
      delete changed[_key];
    }
    unset ? delete current[_key] : current[_key] = _val;
  });

  // Trigger all relevant state changes.
  if (!silent) {
    if (changes.length) {
      this._pending = options;
    }
    for (var i = 0; i < changes.length; i++) {
      this.trigger('change:' + changes[i], this, current[changes[i]], options);
    }
  }

  // You might be wondering why there's a `while` loop here. Changes can
  // be recursively nested within `"change"` events.
  if (changing) {
    return this;
  }
  if (!silent) {
    while (this._pending) {
      options = this._pending;
      this._pending = false;
      this.trigger('change', this, options);
    }
  }
  this._pending = false;
  this._changing = false;
  return this;
};

var getState = function (attr) {
  return this.state[attr];
};

var _typeof$1 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var isDisplayComponent = function (Component) {
  if ((typeof Component === 'undefined' ? 'undefined' : _typeof$1(Component)) === 'object') {
    return Component instanceof Marionette.View || Component instanceof Marionette.Behavior;
  }
  if (typeof Component === 'function') {
    return Component.prototype instanceof Marionette.View || Component.prototype instanceof Marionette.Behavior;
  }
  return false;
};

var mixin = {
  initialize: function initialize(_options) {

    var options = _options || {};

    this.mapState = options.mapStateToProps || this.mapStateToProps || defaultMapStateToProps;
    this.mapDispatch = options.mapDispatchToProps || this.mapDispatchToProps || defaultMapDispatchToProps;
    this.mergeProps = options.mergeProps || this.mergeProps || defaultMergeProps;
    this.props = this.props || {};

    if (options.props) {
      _.extend(this.props, options.props);
    }

    this.store = options.store || this.store;

    if (!this.store && window && window.store) {
      this.store = window.store;
    }

    var storeState = this.store.getState();
    this.state = _.defaults({
      storeState: storeState
    }, this.getInitialState());

    this.bindStateEvents();
    this.clearCache();

    if (!isDisplayComponent(this)) {
      this.trySubscribe();
    }
  },
  getInitialState: function getInitialState() {
    return {};
  },


  setState: setState,

  getState: getState,

  bindStateEvents: function bindStateEvents() {
    var bind = void 0;
    if (this.stateEvents) {
      bind = Marionette.bindEvents || Marionette.bindEntityEvents;
      bind(this, this, this.stateEvents);
    }
  },
  unbindStateEvents: function unbindStateEvents() {
    var unbind = void 0;
    if (this.stateEvents) {
      unbind = Marionette.unbindEvents || Marionette.unbindEntityEvents;
      unbind(this, this, this.stateEvents);
    }
  },
  computeStateProps: function computeStateProps(store, props) {
    if (!this.finalMapStateToProps) {
      return this.configureFinalMapState(store, props);
    }

    var state = store.getState();
    var stateProps = this.doStatePropsDependOnOwnProps ? this.finalMapStateToProps(state, props) : this.finalMapStateToProps(state);

    return stateProps;
  },
  configureFinalMapState: function configureFinalMapState(store, props) {
    var mappedState = this.mapState(store.getState(), props);
    var isFactory = _.isFunction(mappedState);

    this.finalMapStateToProps = isFactory ? mappedState : this.mapState;
    this.doStatePropsDependOnOwnProps = this.finalMapStateToProps.length !== 1;

    if (isFactory) {
      return this.computeStateProps(store, props);
    }

    return mappedState;
  },
  updateStatePropsIfNeeded: function updateStatePropsIfNeeded() {
    var nextStateProps = this.computeStateProps(this.store, this.props);
    if (this.stateProps && _.isEqual(nextStateProps, this.stateProps)) {
      return false;
    }

    this.stateProps = nextStateProps;

    return true;
  },
  computeDispatchProps: function computeDispatchProps(store, props) {
    if (!this.finalMapDispatchToProps) {
      return this.configureFinalMapDispatch(store, props);
    }

    var dispatch = store.dispatch;
    var dispatchProps = this.doDispatchPropsDependOnOwnProps ? this.finalMapDispatchToProps(dispatch, props) : this.finalMapDispatchToProps(dispatch);

    return dispatchProps;
  },
  configureFinalMapDispatch: function configureFinalMapDispatch(store, props) {
    var mappedDispatch = this.mapDispatch(store.dispatch, props);
    var isFactory = _.isFunction(mappedDispatch);

    this.finalMapDispatchToProps = isFactory ? mappedDispatch : this.mapDispatch;
    this.doDispatchPropsDependOnOwnProps = this.finalMapDispatchToProps.length !== 1;

    if (isFactory) {
      return this.computeDispatchProps(store, props);
    }

    return mappedDispatch;
  },
  updateDispatchPropsIfNeeded: function updateDispatchPropsIfNeeded() {
    var nextDispatchProps = this.computeDispatchProps(this.store, this.props);
    if (this.dispatchProps && _.isEqual(nextDispatchProps, this.dispatchProps)) {
      return false;
    }

    this.dispatchProps = nextDispatchProps;

    return true;
  },
  isSubscribed: function isSubscribed() {
    return _.isFunction(this.unsubscribe);
  },
  trySubscribe: function trySubscribe() {
    if (!this.isSubscribed()) {
      this.unsubscribe = this.store.subscribe(this.handleChange.bind(this));
      this.handleDispatchProps();
      this.handleChange();
    }
  },
  tryUnsubscribe: function tryUnsubscribe() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  },
  onRender: function onRender() {
    this.trySubscribe();
  },
  onDestroy: function onDestroy() {
    this.tryUnsubscribe();
    this.unbindStateEvents();
    this.clearCache();
  },
  clearCache: function clearCache() {
    this.dispatchProps = null;
    this.stateProps = null;
    this.finalMapDispatchToProps = null;
    this.finalMapStateToProps = null;
    this.haveInitialStatePropsBeenDetermined = false;
    this.haveInitialDispatchPropsBeenDetermined = false;
  },
  handleDispatchProps: function handleDispatchProps() {
    if (!this.haveInitialDispatchPropsBeenDetermined) {
      this.updateDispatchPropsIfNeeded();
      this.haveInitialDispatchPropsBeenDetermined = true;
    }
  },
  handleChange: function handleChange() {
    if (!this.unsubscribe) {
      return;
    }

    var storeState = this.store.getState();
    var prevStoreState = this.getState('storeState');
    if (this.haveInitialStatePropsBeenDetermined && _.isEqual(prevStoreState, storeState)) {
      return;
    }

    var haveStatePropsChanged = this.updateStatePropsIfNeeded();
    this.haveInitialStatePropsBeenDetermined = true;

    if (haveStatePropsChanged) {

      var mergedProps = this.mergeProps(this.stateProps, this.dispatchProps, this.props);
      this.props = mergedProps;

      _.isFunction(this.componentDidReceiveProps) && this.componentDidReceiveProps(mergedProps);
    }

    this.setState({
      storeState: storeState
    });
  }
};

var connect = (function (_mapStateToProps, _mapDispatchToProps, _mergeProps, _options) {

  var options = _options || {};

  return function (Component) {

    var mapStateToProps = _mapStateToProps || Component.prototype.mapStateToProps || defaultMapStateToProps;
    var mapDispatchToProps = _mapDispatchToProps || Component.prototype.mapDispatchToProps || defaultMapDispatchToProps;
    var mergeProps = _mergeProps || Component.prototype.mergeProps || defaultMergeProps;
    var store = options.store || Component.prototype.store;
    var componentInitialize = Component.prototype.initialize;
    var componentonRender = Component.prototype.onRender;
    var componentOnDestroy = Component.prototype.onDestroy;

    var connectMixin = _.defaults({}, {
      initialize: function initialize(_initOptions) {

        var initOptions = _initOptions || {};

        mixin.initialize.call(this, {
          mapStateToProps: mapStateToProps,
          mapDispatchToProps: mapDispatchToProps,
          mergeProps: mergeProps,
          store: store,
          props: initOptions.props
        });

        if (componentInitialize) {
          componentInitialize.apply(this, arguments);
        }
      },
      onRender: function onRender() {

        mixin.onRender.apply(this, arguments);

        if (componentonRender) {
          componentonRender.apply(this, arguments);
        }
      },
      onDestroy: function onDestroy() {

        mixin.onDestroy.apply(this, arguments);

        if (componentOnDestroy) {
          componentOnDestroy.apply(this, arguments);
        }
      }
    }, mixin);

    if (!isDisplayComponent(Component)) {
      connectMixin = _.omit(connectMixin, 'onRender');
    }

    return Component.extend(connectMixin);
  };
});

exports.connect = connect;
exports.mixin = mixin;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdoZW5kZXJzb24vU2l0ZXMvbWFyaW9uZXR0ZS1yZWR1eC9zcmMvbWFwU3RhdGVUb1Byb3BzLmpzIiwiL1VzZXJzL2FuZHJld2hlbmRlcnNvbi9TaXRlcy9tYXJpb25ldHRlLXJlZHV4L3NyYy9tYXBEaXNwYXRjaFRvUHJvcHMuanMiLCIvVXNlcnMvYW5kcmV3aGVuZGVyc29uL1NpdGVzL21hcmlvbmV0dGUtcmVkdXgvc3JjL21lcmdlUHJvcHMuanMiLCIvVXNlcnMvYW5kcmV3aGVuZGVyc29uL1NpdGVzL21hcmlvbmV0dGUtcmVkdXgvc3JjL3NldFN0YXRlLmpzIiwiL1VzZXJzL2FuZHJld2hlbmRlcnNvbi9TaXRlcy9tYXJpb25ldHRlLXJlZHV4L3NyYy9nZXRTdGF0ZS5qcyIsIi9Vc2Vycy9hbmRyZXdoZW5kZXJzb24vU2l0ZXMvbWFyaW9uZXR0ZS1yZWR1eC9zcmMvaXNEaXNwbGF5Q29tcG9uZW50LmpzIiwiL1VzZXJzL2FuZHJld2hlbmRlcnNvbi9TaXRlcy9tYXJpb25ldHRlLXJlZHV4L3NyYy9taXhpbi5qcyIsIi9Vc2Vycy9hbmRyZXdoZW5kZXJzb24vU2l0ZXMvbWFyaW9uZXR0ZS1yZWR1eC9zcmMvY29ubmVjdC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZGVmYXVsdCBzdGF0ZSA9PiAoe30pXG4iLCJleHBvcnQgZGVmYXVsdCBkaXNwYXRjaCA9PiAoeyBkaXNwYXRjaCB9KVxuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5leHBvcnQgZGVmYXVsdCAoc3RhdGVQcm9wcywgZGlzcGF0Y2hQcm9wcywgcGFyZW50UHJvcHMpID0+IChcbiAgXy5leHRlbmQoe30sIHBhcmVudFByb3BzLCBzdGF0ZVByb3BzLCBkaXNwYXRjaFByb3BzKVxuKVxuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKGtleSwgdmFsLCBvcHRpb25zKSB7XG5cbiAgaWYgKGtleSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBIYW5kbGUgYm90aCBgXCJrZXlcIiwgdmFsdWVgIGFuZCBge2tleTogdmFsdWV9YCAtc3R5bGUgYXJndW1lbnRzLlxuICBsZXQgc3RhdGU7XG4gIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0Jykge1xuICAgIHN0YXRlID0ga2V5O1xuICAgIG9wdGlvbnMgPSB2YWw7XG4gIH0gZWxzZSB7XG4gICAgKHN0YXRlID0ge30pW2tleV0gPSB2YWw7XG4gIH1cblxuICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuXG4gIC8vIEV4dHJhY3Qgc3RhdGUgYW5kIG9wdGlvbnMuXG4gIGNvbnN0IHVuc2V0ICAgICAgPSBvcHRpb25zLnVuc2V0O1xuICBjb25zdCBzaWxlbnQgICAgID0gb3B0aW9ucy5zaWxlbnQ7XG4gIGNvbnN0IGNoYW5nZXMgICAgPSBbXTtcbiAgY29uc3QgY2hhbmdpbmcgICA9IHRoaXMuX2NoYW5naW5nO1xuICB0aGlzLl9jaGFuZ2luZyA9IHRydWU7XG5cbiAgaWYgKCFjaGFuZ2luZykge1xuICAgIHRoaXMuX3ByZXZpb3VzU3RhdGUgPSBfLmNsb25lKHRoaXMuc3RhdGUpO1xuICAgIHRoaXMuY2hhbmdlZCA9IHt9O1xuICB9XG5cbiAgY29uc3QgY3VycmVudCA9IHRoaXMuc3RhdGU7XG4gIGNvbnN0IGNoYW5nZWQgPSB0aGlzLmNoYW5nZWQ7XG4gIGNvbnN0IHByZXYgICAgPSB0aGlzLl9wcmV2aW91c1N0YXRlO1xuXG4gIC8vIEZvciBlYWNoIGBzZXRgIHN0YXRlLCB1cGRhdGUgb3IgZGVsZXRlIHRoZSBjdXJyZW50IHZhbHVlLlxuICBfLmVhY2goc3RhdGUsIGZ1bmN0aW9uKF92YWwsIF9rZXkpIHtcbiAgICBpZiAoIV8uaXNFcXVhbChjdXJyZW50W19rZXldLCBfdmFsKSkge1xuICAgICAgY2hhbmdlcy5wdXNoKF9rZXkpO1xuICAgIH1cbiAgICBpZiAoIV8uaXNFcXVhbChwcmV2W19rZXldLCBfdmFsKSkge1xuICAgICAgY2hhbmdlZFtfa2V5XSA9IF92YWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZSBjaGFuZ2VkW19rZXldO1xuICAgIH1cbiAgICB1bnNldCA/IGRlbGV0ZSBjdXJyZW50W19rZXldIDogY3VycmVudFtfa2V5XSA9IF92YWw7XG4gIH0pO1xuXG4gIC8vIFRyaWdnZXIgYWxsIHJlbGV2YW50IHN0YXRlIGNoYW5nZXMuXG4gIGlmICghc2lsZW50KSB7XG4gICAgaWYgKGNoYW5nZXMubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9wZW5kaW5nID0gb3B0aW9ucztcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLnRyaWdnZXIoJ2NoYW5nZTonICsgY2hhbmdlc1tpXSwgdGhpcywgY3VycmVudFtjaGFuZ2VzW2ldXSwgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgLy8gWW91IG1pZ2h0IGJlIHdvbmRlcmluZyB3aHkgdGhlcmUncyBhIGB3aGlsZWAgbG9vcCBoZXJlLiBDaGFuZ2VzIGNhblxuICAvLyBiZSByZWN1cnNpdmVseSBuZXN0ZWQgd2l0aGluIGBcImNoYW5nZVwiYCBldmVudHMuXG4gIGlmIChjaGFuZ2luZykge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIGlmICghc2lsZW50KSB7XG4gICAgd2hpbGUgKHRoaXMuX3BlbmRpbmcpIHtcbiAgICAgIG9wdGlvbnMgPSB0aGlzLl9wZW5kaW5nO1xuICAgICAgdGhpcy5fcGVuZGluZyA9IGZhbHNlO1xuICAgICAgdGhpcy50cmlnZ2VyKCdjaGFuZ2UnLCB0aGlzLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cbiAgdGhpcy5fcGVuZGluZyA9IGZhbHNlO1xuICB0aGlzLl9jaGFuZ2luZyA9IGZhbHNlO1xuICByZXR1cm4gdGhpc1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oYXR0cikge1xuICByZXR1cm4gdGhpcy5zdGF0ZVthdHRyXTtcbn1cbiIsImltcG9ydCBNYXJpb25ldHRlIGZyb20gJ21hcmlvbmV0dGUnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKENvbXBvbmVudCkge1xuICBpZiAodHlwZW9mIENvbXBvbmVudCA9PT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gQ29tcG9uZW50IGluc3RhbmNlb2YgTWFyaW9uZXR0ZS5WaWV3IHx8IENvbXBvbmVudCBpbnN0YW5jZW9mIE1hcmlvbmV0dGUuQmVoYXZpb3JcbiAgfVxuICBpZiAodHlwZW9mIENvbXBvbmVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBDb21wb25lbnQucHJvdG90eXBlIGluc3RhbmNlb2YgTWFyaW9uZXR0ZS5WaWV3IHx8IENvbXBvbmVudC5wcm90b3R5cGUgaW5zdGFuY2VvZiBNYXJpb25ldHRlLkJlaGF2aW9yXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBNYXJpb25ldHRlIGZyb20gJ21hcmlvbmV0dGUnXG5pbXBvcnQgZGVmYXVsdE1hcFN0YXRlVG9Qcm9wcyBmcm9tICcuL21hcFN0YXRlVG9Qcm9wcydcbmltcG9ydCBkZWZhdWx0TWFwRGlzcGF0Y2hUb1Byb3BzIGZyb20gJy4vbWFwRGlzcGF0Y2hUb1Byb3BzJ1xuaW1wb3J0IGRlZmF1bHRNZXJnZVByb3BzIGZyb20gJy4vbWVyZ2VQcm9wcydcbmltcG9ydCBzZXRTdGF0ZSBmcm9tICcuL3NldFN0YXRlJ1xuaW1wb3J0IGdldFN0YXRlIGZyb20gJy4vZ2V0U3RhdGUnXG5pbXBvcnQgaXNEaXNwbGF5Q29tcG9uZW50IGZyb20gJy4vaXNEaXNwbGF5Q29tcG9uZW50JztcblxuZXhwb3J0IGRlZmF1bHQge1xuXG4gIGluaXRpYWxpemUoX29wdGlvbnMpIHtcblxuICAgIGNvbnN0IG9wdGlvbnMgPSBfb3B0aW9ucyB8fCB7fTtcblxuICAgIHRoaXMubWFwU3RhdGUgPSBvcHRpb25zLm1hcFN0YXRlVG9Qcm9wcyB8fCB0aGlzLm1hcFN0YXRlVG9Qcm9wcyB8fCBkZWZhdWx0TWFwU3RhdGVUb1Byb3BzO1xuICAgIHRoaXMubWFwRGlzcGF0Y2ggPSBvcHRpb25zLm1hcERpc3BhdGNoVG9Qcm9wcyB8fCB0aGlzLm1hcERpc3BhdGNoVG9Qcm9wcyB8fCBkZWZhdWx0TWFwRGlzcGF0Y2hUb1Byb3BzO1xuICAgIHRoaXMubWVyZ2VQcm9wcyA9IG9wdGlvbnMubWVyZ2VQcm9wcyB8fCB0aGlzLm1lcmdlUHJvcHMgfHwgZGVmYXVsdE1lcmdlUHJvcHM7XG4gICAgdGhpcy5wcm9wcyA9IHRoaXMucHJvcHMgfHwge307XG5cbiAgICBpZiAob3B0aW9ucy5wcm9wcykge1xuICAgICAgXy5leHRlbmQodGhpcy5wcm9wcywgb3B0aW9ucy5wcm9wcylcbiAgICB9XG5cbiAgICB0aGlzLnN0b3JlID0gb3B0aW9ucy5zdG9yZSB8fCB0aGlzLnN0b3JlXG5cbiAgICBpZiAoIXRoaXMuc3RvcmUgJiYgd2luZG93ICYmIHdpbmRvdy5zdG9yZSkge1xuICAgICAgdGhpcy5zdG9yZSA9IHdpbmRvdy5zdG9yZVxuICAgIH1cblxuICAgIGNvbnN0IHN0b3JlU3RhdGUgPSB0aGlzLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgdGhpcy5zdGF0ZSA9IF8uZGVmYXVsdHMoe1xuICAgICAgc3RvcmVTdGF0ZTogc3RvcmVTdGF0ZVxuICAgIH0sIHRoaXMuZ2V0SW5pdGlhbFN0YXRlKCkpO1xuXG4gICAgdGhpcy5iaW5kU3RhdGVFdmVudHMoKTtcbiAgICB0aGlzLmNsZWFyQ2FjaGUoKTtcblxuICAgIGlmICghaXNEaXNwbGF5Q29tcG9uZW50KHRoaXMpKSB7XG4gICAgICB0aGlzLnRyeVN1YnNjcmliZSgpXG4gICAgfVxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZSgpIHtcbiAgICByZXR1cm4ge31cbiAgfSxcblxuICBzZXRTdGF0ZSxcblxuICBnZXRTdGF0ZSxcblxuICBiaW5kU3RhdGVFdmVudHMoKSB7XG4gICAgbGV0IGJpbmQ7XG4gICAgaWYgKHRoaXMuc3RhdGVFdmVudHMpIHtcbiAgICAgIGJpbmQgPSBNYXJpb25ldHRlLmJpbmRFdmVudHMgfHwgTWFyaW9uZXR0ZS5iaW5kRW50aXR5RXZlbnRzO1xuICAgICAgYmluZCh0aGlzLCB0aGlzLCB0aGlzLnN0YXRlRXZlbnRzKVxuICAgIH1cbiAgfSxcblxuICB1bmJpbmRTdGF0ZUV2ZW50cygpIHtcbiAgICBsZXQgdW5iaW5kO1xuICAgIGlmICh0aGlzLnN0YXRlRXZlbnRzKSB7XG4gICAgICB1bmJpbmQgPSBNYXJpb25ldHRlLnVuYmluZEV2ZW50cyB8fCBNYXJpb25ldHRlLnVuYmluZEVudGl0eUV2ZW50cztcbiAgICAgIHVuYmluZCh0aGlzLCB0aGlzLCB0aGlzLnN0YXRlRXZlbnRzKVxuICAgIH1cbiAgfSxcblxuICBjb21wdXRlU3RhdGVQcm9wcyhzdG9yZSwgcHJvcHMpIHtcbiAgICBpZiAoIXRoaXMuZmluYWxNYXBTdGF0ZVRvUHJvcHMpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbmZpZ3VyZUZpbmFsTWFwU3RhdGUoc3RvcmUsIHByb3BzKVxuICAgIH1cblxuICAgIGNvbnN0IHN0YXRlID0gc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBzdGF0ZVByb3BzID0gdGhpcy5kb1N0YXRlUHJvcHNEZXBlbmRPbk93blByb3BzID9cbiAgICAgIHRoaXMuZmluYWxNYXBTdGF0ZVRvUHJvcHMoc3RhdGUsIHByb3BzKSA6XG4gICAgICB0aGlzLmZpbmFsTWFwU3RhdGVUb1Byb3BzKHN0YXRlKTtcblxuICAgIHJldHVybiBzdGF0ZVByb3BzXG4gIH0sXG5cbiAgY29uZmlndXJlRmluYWxNYXBTdGF0ZShzdG9yZSwgcHJvcHMpIHtcbiAgICBjb25zdCBtYXBwZWRTdGF0ZSA9IHRoaXMubWFwU3RhdGUoc3RvcmUuZ2V0U3RhdGUoKSwgcHJvcHMpO1xuICAgIGNvbnN0IGlzRmFjdG9yeSA9IF8uaXNGdW5jdGlvbihtYXBwZWRTdGF0ZSk7XG5cbiAgICB0aGlzLmZpbmFsTWFwU3RhdGVUb1Byb3BzID0gaXNGYWN0b3J5ID8gbWFwcGVkU3RhdGUgOiB0aGlzLm1hcFN0YXRlO1xuICAgIHRoaXMuZG9TdGF0ZVByb3BzRGVwZW5kT25Pd25Qcm9wcyA9IHRoaXMuZmluYWxNYXBTdGF0ZVRvUHJvcHMubGVuZ3RoICE9PSAxO1xuXG4gICAgaWYgKGlzRmFjdG9yeSkge1xuICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZVN0YXRlUHJvcHMoc3RvcmUsIHByb3BzKVxuICAgIH1cblxuICAgIHJldHVybiBtYXBwZWRTdGF0ZVxuICB9LFxuXG4gIHVwZGF0ZVN0YXRlUHJvcHNJZk5lZWRlZCgpIHtcbiAgICBjb25zdCBuZXh0U3RhdGVQcm9wcyA9IHRoaXMuY29tcHV0ZVN0YXRlUHJvcHModGhpcy5zdG9yZSwgdGhpcy5wcm9wcyk7XG4gICAgaWYgKHRoaXMuc3RhdGVQcm9wcyAmJiBfLmlzRXF1YWwobmV4dFN0YXRlUHJvcHMsIHRoaXMuc3RhdGVQcm9wcykpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHRoaXMuc3RhdGVQcm9wcyA9IG5leHRTdGF0ZVByb3BzO1xuXG4gICAgcmV0dXJuIHRydWVcbiAgfSxcblxuICBjb21wdXRlRGlzcGF0Y2hQcm9wcyhzdG9yZSwgcHJvcHMpIHtcbiAgICBpZiAoIXRoaXMuZmluYWxNYXBEaXNwYXRjaFRvUHJvcHMpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbmZpZ3VyZUZpbmFsTWFwRGlzcGF0Y2goc3RvcmUsIHByb3BzKVxuICAgIH1cblxuICAgIGNvbnN0IGRpc3BhdGNoID0gc3RvcmUuZGlzcGF0Y2g7XG4gICAgY29uc3QgZGlzcGF0Y2hQcm9wcyA9IHRoaXMuZG9EaXNwYXRjaFByb3BzRGVwZW5kT25Pd25Qcm9wcyA/XG4gICAgICB0aGlzLmZpbmFsTWFwRGlzcGF0Y2hUb1Byb3BzKGRpc3BhdGNoLCBwcm9wcykgOlxuICAgICAgdGhpcy5maW5hbE1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaCk7XG5cbiAgICByZXR1cm4gZGlzcGF0Y2hQcm9wc1xuICB9LFxuXG4gIGNvbmZpZ3VyZUZpbmFsTWFwRGlzcGF0Y2goc3RvcmUsIHByb3BzKSB7XG4gICAgY29uc3QgbWFwcGVkRGlzcGF0Y2ggPSB0aGlzLm1hcERpc3BhdGNoKHN0b3JlLmRpc3BhdGNoLCBwcm9wcyk7XG4gICAgY29uc3QgaXNGYWN0b3J5ID0gXy5pc0Z1bmN0aW9uKG1hcHBlZERpc3BhdGNoKTtcblxuICAgIHRoaXMuZmluYWxNYXBEaXNwYXRjaFRvUHJvcHMgPSBpc0ZhY3RvcnkgPyBtYXBwZWREaXNwYXRjaCA6IHRoaXMubWFwRGlzcGF0Y2g7XG4gICAgdGhpcy5kb0Rpc3BhdGNoUHJvcHNEZXBlbmRPbk93blByb3BzID0gdGhpcy5maW5hbE1hcERpc3BhdGNoVG9Qcm9wcy5sZW5ndGggIT09IDE7XG5cbiAgICBpZiAoaXNGYWN0b3J5KSB7XG4gICAgICByZXR1cm4gdGhpcy5jb21wdXRlRGlzcGF0Y2hQcm9wcyhzdG9yZSwgcHJvcHMpXG4gICAgfVxuXG4gICAgcmV0dXJuIG1hcHBlZERpc3BhdGNoXG4gIH0sXG5cbiAgdXBkYXRlRGlzcGF0Y2hQcm9wc0lmTmVlZGVkKCkge1xuICAgIGNvbnN0IG5leHREaXNwYXRjaFByb3BzID0gdGhpcy5jb21wdXRlRGlzcGF0Y2hQcm9wcyh0aGlzLnN0b3JlLCB0aGlzLnByb3BzKTtcbiAgICBpZiAodGhpcy5kaXNwYXRjaFByb3BzICYmIF8uaXNFcXVhbChuZXh0RGlzcGF0Y2hQcm9wcywgdGhpcy5kaXNwYXRjaFByb3BzKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgdGhpcy5kaXNwYXRjaFByb3BzID0gbmV4dERpc3BhdGNoUHJvcHM7XG5cbiAgICByZXR1cm4gdHJ1ZVxuICB9LFxuXG4gIGlzU3Vic2NyaWJlZCgpIHtcbiAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKHRoaXMudW5zdWJzY3JpYmUpXG4gIH0sXG5cbiAgdHJ5U3Vic2NyaWJlKCkge1xuICAgIGlmICghdGhpcy5pc1N1YnNjcmliZWQoKSkge1xuICAgICAgdGhpcy51bnN1YnNjcmliZSA9IHRoaXMuc3RvcmUuc3Vic2NyaWJlKHRoaXMuaGFuZGxlQ2hhbmdlLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5oYW5kbGVEaXNwYXRjaFByb3BzKCk7XG4gICAgICB0aGlzLmhhbmRsZUNoYW5nZSgpXG4gICAgfVxuICB9LFxuXG4gIHRyeVVuc3Vic2NyaWJlKCkge1xuICAgIGlmICh0aGlzLnVuc3Vic2NyaWJlKSB7XG4gICAgICB0aGlzLnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLnVuc3Vic2NyaWJlID0gbnVsbFxuICAgIH1cbiAgfSxcblxuICBvblJlbmRlcigpIHtcbiAgICB0aGlzLnRyeVN1YnNjcmliZSgpXG4gIH0sXG5cbiAgb25EZXN0cm95KCkge1xuICAgIHRoaXMudHJ5VW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLnVuYmluZFN0YXRlRXZlbnRzKCk7XG4gICAgdGhpcy5jbGVhckNhY2hlKClcbiAgfSxcblxuICBjbGVhckNhY2hlKCkge1xuICAgIHRoaXMuZGlzcGF0Y2hQcm9wcyA9IG51bGw7XG4gICAgdGhpcy5zdGF0ZVByb3BzID0gbnVsbDtcbiAgICB0aGlzLmZpbmFsTWFwRGlzcGF0Y2hUb1Byb3BzID0gbnVsbDtcbiAgICB0aGlzLmZpbmFsTWFwU3RhdGVUb1Byb3BzID0gbnVsbDtcbiAgICB0aGlzLmhhdmVJbml0aWFsU3RhdGVQcm9wc0JlZW5EZXRlcm1pbmVkID0gZmFsc2U7XG4gICAgdGhpcy5oYXZlSW5pdGlhbERpc3BhdGNoUHJvcHNCZWVuRGV0ZXJtaW5lZCA9IGZhbHNlXG4gIH0sXG5cbiAgaGFuZGxlRGlzcGF0Y2hQcm9wcygpIHtcbiAgICBpZiAoIXRoaXMuaGF2ZUluaXRpYWxEaXNwYXRjaFByb3BzQmVlbkRldGVybWluZWQpIHtcbiAgICAgIHRoaXMudXBkYXRlRGlzcGF0Y2hQcm9wc0lmTmVlZGVkKCk7XG4gICAgICB0aGlzLmhhdmVJbml0aWFsRGlzcGF0Y2hQcm9wc0JlZW5EZXRlcm1pbmVkID0gdHJ1ZVxuICAgIH1cbiAgfSxcblxuICBoYW5kbGVDaGFuZ2UoKSB7XG4gICAgaWYgKCF0aGlzLnVuc3Vic2NyaWJlKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBzdG9yZVN0YXRlID0gdGhpcy5zdG9yZS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IHByZXZTdG9yZVN0YXRlID0gdGhpcy5nZXRTdGF0ZSgnc3RvcmVTdGF0ZScpO1xuICAgIGlmICh0aGlzLmhhdmVJbml0aWFsU3RhdGVQcm9wc0JlZW5EZXRlcm1pbmVkICYmIF8uaXNFcXVhbChwcmV2U3RvcmVTdGF0ZSwgc3RvcmVTdGF0ZSkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IGhhdmVTdGF0ZVByb3BzQ2hhbmdlZCA9IHRoaXMudXBkYXRlU3RhdGVQcm9wc0lmTmVlZGVkKCk7XG4gICAgdGhpcy5oYXZlSW5pdGlhbFN0YXRlUHJvcHNCZWVuRGV0ZXJtaW5lZCA9IHRydWU7XG5cbiAgICBpZiAoaGF2ZVN0YXRlUHJvcHNDaGFuZ2VkKSB7XG5cbiAgICAgIGNvbnN0IG1lcmdlZFByb3BzID0gdGhpcy5tZXJnZVByb3BzKHRoaXMuc3RhdGVQcm9wcywgdGhpcy5kaXNwYXRjaFByb3BzLCB0aGlzLnByb3BzKTtcbiAgICAgIHRoaXMucHJvcHMgPSBtZXJnZWRQcm9wcztcblxuICAgICAgXy5pc0Z1bmN0aW9uKHRoaXMuY29tcG9uZW50RGlkUmVjZWl2ZVByb3BzKSAmJiB0aGlzLmNvbXBvbmVudERpZFJlY2VpdmVQcm9wcyhtZXJnZWRQcm9wcylcbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHN0b3JlU3RhdGVcbiAgICB9KVxuICB9XG59O1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgZGVmYXVsdE1hcFN0YXRlVG9Qcm9wcyBmcm9tICcuL21hcFN0YXRlVG9Qcm9wcydcbmltcG9ydCBkZWZhdWx0TWFwRGlzcGF0Y2hUb1Byb3BzIGZyb20gJy4vbWFwRGlzcGF0Y2hUb1Byb3BzJ1xuaW1wb3J0IGRlZmF1bHRNZXJnZVByb3BzIGZyb20gJy4vbWVyZ2VQcm9wcydcbmltcG9ydCBtaXhpbiBmcm9tICcuL21peGluJ1xuaW1wb3J0IGlzRGlzcGxheUNvbXBvbmVudCBmcm9tICcuL2lzRGlzcGxheUNvbXBvbmVudCc7XG5cbmV4cG9ydCBkZWZhdWx0IChfbWFwU3RhdGVUb1Byb3BzLCBfbWFwRGlzcGF0Y2hUb1Byb3BzLCBfbWVyZ2VQcm9wcywgX29wdGlvbnMpID0+IHtcblxuICBjb25zdCBvcHRpb25zID0gX29wdGlvbnMgfHwge307XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKENvbXBvbmVudCkge1xuXG4gICAgY29uc3QgbWFwU3RhdGVUb1Byb3BzID0gX21hcFN0YXRlVG9Qcm9wcyB8fCBDb21wb25lbnQucHJvdG90eXBlLm1hcFN0YXRlVG9Qcm9wcyB8fCBkZWZhdWx0TWFwU3RhdGVUb1Byb3BzO1xuICAgIGNvbnN0IG1hcERpc3BhdGNoVG9Qcm9wcyA9IF9tYXBEaXNwYXRjaFRvUHJvcHMgfHwgQ29tcG9uZW50LnByb3RvdHlwZS5tYXBEaXNwYXRjaFRvUHJvcHMgfHwgZGVmYXVsdE1hcERpc3BhdGNoVG9Qcm9wcztcbiAgICBjb25zdCBtZXJnZVByb3BzID0gX21lcmdlUHJvcHMgfHwgQ29tcG9uZW50LnByb3RvdHlwZS5tZXJnZVByb3BzIHx8IGRlZmF1bHRNZXJnZVByb3BzO1xuICAgIGNvbnN0IHN0b3JlID0gb3B0aW9ucy5zdG9yZSB8fCBDb21wb25lbnQucHJvdG90eXBlLnN0b3JlO1xuICAgIGNvbnN0IGNvbXBvbmVudEluaXRpYWxpemUgPSBDb21wb25lbnQucHJvdG90eXBlLmluaXRpYWxpemU7XG4gICAgY29uc3QgY29tcG9uZW50b25SZW5kZXIgPSBDb21wb25lbnQucHJvdG90eXBlLm9uUmVuZGVyO1xuICAgIGNvbnN0IGNvbXBvbmVudE9uRGVzdHJveSA9IENvbXBvbmVudC5wcm90b3R5cGUub25EZXN0cm95O1xuXG4gICAgbGV0IGNvbm5lY3RNaXhpbiA9IF8uZGVmYXVsdHMoe30sIHtcblxuICAgICAgaW5pdGlhbGl6ZShfaW5pdE9wdGlvbnMpIHtcblxuICAgICAgICBjb25zdCBpbml0T3B0aW9ucyA9IF9pbml0T3B0aW9ucyB8fCB7fTtcblxuICAgICAgICBtaXhpbi5pbml0aWFsaXplLmNhbGwodGhpcywge1xuICAgICAgICAgIG1hcFN0YXRlVG9Qcm9wcyxcbiAgICAgICAgICBtYXBEaXNwYXRjaFRvUHJvcHMsXG4gICAgICAgICAgbWVyZ2VQcm9wcyxcbiAgICAgICAgICBzdG9yZSxcbiAgICAgICAgICBwcm9wczogaW5pdE9wdGlvbnMucHJvcHNcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGNvbXBvbmVudEluaXRpYWxpemUpIHtcbiAgICAgICAgICBjb21wb25lbnRJbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIG9uUmVuZGVyKCkge1xuXG4gICAgICAgIG1peGluLm9uUmVuZGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgaWYgKGNvbXBvbmVudG9uUmVuZGVyKSB7XG4gICAgICAgICAgY29tcG9uZW50b25SZW5kZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBvbkRlc3Ryb3koKSB7XG5cbiAgICAgICAgbWl4aW4ub25EZXN0cm95LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgaWYgKGNvbXBvbmVudE9uRGVzdHJveSkge1xuICAgICAgICAgIGNvbXBvbmVudE9uRGVzdHJveS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwgbWl4aW4pO1xuXG4gICAgaWYgKCFpc0Rpc3BsYXlDb21wb25lbnQoQ29tcG9uZW50KSkge1xuICAgICAgY29ubmVjdE1peGluID0gXy5vbWl0KGNvbm5lY3RNaXhpbiwgJ29uUmVuZGVyJylcbiAgICB9XG5cbiAgICByZXR1cm4gQ29tcG9uZW50LmV4dGVuZChjb25uZWN0TWl4aW4pXG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJkaXNwYXRjaCIsInN0YXRlUHJvcHMiLCJkaXNwYXRjaFByb3BzIiwicGFyZW50UHJvcHMiLCJfIiwiZXh0ZW5kIiwia2V5IiwidmFsIiwib3B0aW9ucyIsInN0YXRlIiwidW5zZXQiLCJzaWxlbnQiLCJjaGFuZ2VzIiwiY2hhbmdpbmciLCJfY2hhbmdpbmciLCJfcHJldmlvdXNTdGF0ZSIsImNsb25lIiwiY2hhbmdlZCIsImN1cnJlbnQiLCJwcmV2IiwiZWFjaCIsIl92YWwiLCJfa2V5IiwiaXNFcXVhbCIsInB1c2giLCJsZW5ndGgiLCJfcGVuZGluZyIsImkiLCJ0cmlnZ2VyIiwiYXR0ciIsIkNvbXBvbmVudCIsIk1hcmlvbmV0dGUiLCJWaWV3IiwiQmVoYXZpb3IiLCJwcm90b3R5cGUiLCJfb3B0aW9ucyIsIm1hcFN0YXRlIiwibWFwU3RhdGVUb1Byb3BzIiwiZGVmYXVsdE1hcFN0YXRlVG9Qcm9wcyIsIm1hcERpc3BhdGNoIiwibWFwRGlzcGF0Y2hUb1Byb3BzIiwiZGVmYXVsdE1hcERpc3BhdGNoVG9Qcm9wcyIsIm1lcmdlUHJvcHMiLCJkZWZhdWx0TWVyZ2VQcm9wcyIsInByb3BzIiwic3RvcmUiLCJ3aW5kb3ciLCJzdG9yZVN0YXRlIiwiZ2V0U3RhdGUiLCJkZWZhdWx0cyIsImdldEluaXRpYWxTdGF0ZSIsImJpbmRTdGF0ZUV2ZW50cyIsImNsZWFyQ2FjaGUiLCJpc0Rpc3BsYXlDb21wb25lbnQiLCJ0cnlTdWJzY3JpYmUiLCJiaW5kIiwic3RhdGVFdmVudHMiLCJiaW5kRXZlbnRzIiwiYmluZEVudGl0eUV2ZW50cyIsInVuYmluZCIsInVuYmluZEV2ZW50cyIsInVuYmluZEVudGl0eUV2ZW50cyIsImZpbmFsTWFwU3RhdGVUb1Byb3BzIiwiY29uZmlndXJlRmluYWxNYXBTdGF0ZSIsImRvU3RhdGVQcm9wc0RlcGVuZE9uT3duUHJvcHMiLCJtYXBwZWRTdGF0ZSIsImlzRmFjdG9yeSIsImlzRnVuY3Rpb24iLCJjb21wdXRlU3RhdGVQcm9wcyIsIm5leHRTdGF0ZVByb3BzIiwiZmluYWxNYXBEaXNwYXRjaFRvUHJvcHMiLCJjb25maWd1cmVGaW5hbE1hcERpc3BhdGNoIiwiZG9EaXNwYXRjaFByb3BzRGVwZW5kT25Pd25Qcm9wcyIsIm1hcHBlZERpc3BhdGNoIiwiY29tcHV0ZURpc3BhdGNoUHJvcHMiLCJuZXh0RGlzcGF0Y2hQcm9wcyIsInVuc3Vic2NyaWJlIiwiaXNTdWJzY3JpYmVkIiwic3Vic2NyaWJlIiwiaGFuZGxlQ2hhbmdlIiwiaGFuZGxlRGlzcGF0Y2hQcm9wcyIsInRyeVVuc3Vic2NyaWJlIiwidW5iaW5kU3RhdGVFdmVudHMiLCJoYXZlSW5pdGlhbFN0YXRlUHJvcHNCZWVuRGV0ZXJtaW5lZCIsImhhdmVJbml0aWFsRGlzcGF0Y2hQcm9wc0JlZW5EZXRlcm1pbmVkIiwidXBkYXRlRGlzcGF0Y2hQcm9wc0lmTmVlZGVkIiwicHJldlN0b3JlU3RhdGUiLCJoYXZlU3RhdGVQcm9wc0NoYW5nZWQiLCJ1cGRhdGVTdGF0ZVByb3BzSWZOZWVkZWQiLCJtZXJnZWRQcm9wcyIsImNvbXBvbmVudERpZFJlY2VpdmVQcm9wcyIsInNldFN0YXRlIiwiX21hcFN0YXRlVG9Qcm9wcyIsIl9tYXBEaXNwYXRjaFRvUHJvcHMiLCJfbWVyZ2VQcm9wcyIsImNvbXBvbmVudEluaXRpYWxpemUiLCJpbml0aWFsaXplIiwiY29tcG9uZW50b25SZW5kZXIiLCJvblJlbmRlciIsImNvbXBvbmVudE9uRGVzdHJveSIsIm9uRGVzdHJveSIsImNvbm5lY3RNaXhpbiIsIl9pbml0T3B0aW9ucyIsImluaXRPcHRpb25zIiwiY2FsbCIsImFwcGx5IiwiYXJndW1lbnRzIiwibWl4aW4iLCJvbWl0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDhCQUFlO1NBQVUsRUFBVjtDQUFmOztBQ0FBLGlDQUFlO1NBQWEsRUFBRUEsa0JBQUYsRUFBYjtDQUFmOztBQ0NBLHlCQUFlLFVBQUNDLFVB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