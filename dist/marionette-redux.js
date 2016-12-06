// Marionette Redux
// ----------------------------------
// v0.1.7
//
// Copyright (c)2016 Andrew Henderson.
// Distributed under MIT license


(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('underscore'), require('backbone.marionette')) :
	typeof define === 'function' && define.amd ? define(['underscore', 'backbone.marionette'], factory) :
	(global.MarionetteRedux = factory(global._,global.Marionette));
}(this, (function (underscore,backbone_marionette) { 'use strict';

function mapStateToProps() {
  return {};
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  };
}

function mergeProps(stateProps, dispatchProps, parentProps) {
  return underscore.extend({}, parentProps, stateProps, dispatchProps);
}

function isDisplayComponent(Component) {
  if (underscore.isFunction(Component)) {
    return Component.prototype instanceof backbone_marionette.View || Component.prototype instanceof backbone_marionette.Behavior;
  }
  if (underscore.isObject(Component)) {
    return Component instanceof backbone_marionette.View || Component instanceof backbone_marionette.Behavior;
  }
  return false;
}

var mixin = {
  initialize: function initialize(_options) {

    var options = _options || {};

    this.mapState = options.mapStateToProps || this.mapStateToProps || mapStateToProps;
    this.mapDispatch = options.mapDispatchToProps || this.mapDispatchToProps || mapDispatchToProps;
    this.mergeProps = options.mergeProps || this.mergeProps || mergeProps;
    this.props = this.props || {};

    if (options.props) {
      underscore.extend(this.props, options.props);
    }

    this.store = options.store || this.store;

    if (!this.store && window && window.store) {
      this.store = window.store;
    }

    var storeState = this.store.getState();
    this.state = underscore.defaults({
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
  setState: function setState(key, val, options) {

    if (key == null) {
      return this;
    }

    // Handle both `"key", value` and `{key: value}` -style arguments.
    var state = void 0;
    if (underscore.isObject(key)) {
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
      this._previousState = underscore.clone(this.state);
      this.changed = {};
    }

    var current = this.state;
    var changed = this.changed;
    var prev = this._previousState;

    // For each `set` state, update or delete the current value.
    underscore.each(state, function (_val, _key) {
      if (!underscore.isEqual(current[_key], _val)) {
        changes.push(_key);
      }
      if (!underscore.isEqual(prev[_key], _val)) {
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
  },
  getState: function getState(attr) {
    return this.state[attr];
  },
  bindStateEvents: function bindStateEvents() {
    var bind = backbone_marionette.bindEvents || backbone_marionette.bindEntityEvents;
    if (this.stateEvents) {
      bind(this, this, this.stateEvents);
    }
  },
  unbindStateEvents: function unbindStateEvents() {
    var unbind = backbone_marionette.unbindEvents || backbone_marionette.unbindEntityEvents;
    if (this.stateEvents) {
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
    var isFactory = underscore.isFunction(mappedState);

    this.finalMapStateToProps = isFactory ? mappedState : this.mapState;
    this.doStatePropsDependOnOwnProps = this.finalMapStateToProps.length !== 1;

    if (isFactory) {
      return this.computeStateProps(store, props);
    }

    return mappedState;
  },
  updateStatePropsIfNeeded: function updateStatePropsIfNeeded() {
    var nextStateProps = this.computeStateProps(this.store, this.props);
    if (this.stateProps && underscore.isEqual(nextStateProps, this.stateProps)) {
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
    var isFactory = underscore.isFunction(mappedDispatch);

    this.finalMapDispatchToProps = isFactory ? mappedDispatch : this.mapDispatch;
    this.doDispatchPropsDependOnOwnProps = this.finalMapDispatchToProps.length !== 1;

    if (isFactory) {
      return this.computeDispatchProps(store, props);
    }

    return mappedDispatch;
  },
  updateDispatchPropsIfNeeded: function updateDispatchPropsIfNeeded() {
    var nextDispatchProps = this.computeDispatchProps(this.store, this.props);
    if (this.dispatchProps && underscore.isEqual(nextDispatchProps, this.dispatchProps)) {
      return false;
    }

    this.dispatchProps = nextDispatchProps;

    return true;
  },
  isSubscribed: function isSubscribed() {
    return underscore.isFunction(this.unsubscribe);
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
    if (this.haveInitialStatePropsBeenDetermined && underscore.isEqual(prevStoreState, storeState)) {
      return;
    }

    var haveStatePropsChanged = this.updateStatePropsIfNeeded();
    this.haveInitialStatePropsBeenDetermined = true;

    if (haveStatePropsChanged) {

      var mergedProps = this.mergeProps(this.stateProps, this.dispatchProps, this.props);
      this.props = mergedProps;

      underscore.isFunction(this.componentDidReceiveProps) && this.componentDidReceiveProps(mergedProps);
    }

    this.setState({
      storeState: storeState
    });
  }
};

function connect(_mapStateToProps, _mapDispatchToProps, _mergeProps, _options) {

  var options = _options || {};

  return function (Component) {

    var mapStateToProps$$1 = _mapStateToProps || Component.prototype.mapStateToProps || mapStateToProps;
    var mapDispatchToProps$$1 = _mapDispatchToProps || Component.prototype.mapDispatchToProps || mapDispatchToProps;
    var mergeProps$$1 = _mergeProps || Component.prototype.mergeProps || mergeProps;
    var store = options.store || Component.prototype.store;
    var componentInitialize = Component.prototype.initialize;
    var componentonRender = Component.prototype.onRender;
    var componentOnDestroy = Component.prototype.onDestroy;

    var connectMixin = underscore.defaults({}, {
      initialize: function initialize(_initOptions) {

        var initOptions = _initOptions || {};

        mixin.initialize.call(this, {
          mapStateToProps: mapStateToProps$$1,
          mapDispatchToProps: mapDispatchToProps$$1,
          mergeProps: mergeProps$$1,
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
      connectMixin = underscore.omit(connectMixin, 'onRender');
    }

    return Component.extend(connectMixin);
  };
}

var version = "0.1.7";

var MarionetteRedux = {
  connect: connect,
  mixin: mixin,
  VERSION: version
};

return MarionetteRedux;

})));

//# sourceMappingURL=marionette-redux.js.map
