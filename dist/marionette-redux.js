(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('underscore')) :
  typeof define === 'function' && define.amd ? define(['underscore'], factory) :
  (global.MarionetteRedux = factory(global._));
}(this, (function (_) { 'use strict';

_ = 'default' in _ ? _['default'] : _;

function mapStateToProps() {
  return {};
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  };
}

function mergeProps(stateProps, dispatchProps, parentProps) {
  return _.extend({}, parentProps, stateProps, dispatchProps);
}

function isDisplayComponent(Component) {
  if (_.isFunction(Component)) {
    return Component.prototype.hasOwnProperty('getUI');
  }
  if (_.isObject(Component)) {
    return Object.getPrototypeOf(Component).hasOwnProperty('getUI');
  }
  return false;
}

function bindFromStrings(target, entity, evt, methods, actionName) {
  var methodNames = methods.split(/\s+/);

  _.each(methodNames, function (methodName) {
    var method = target[methodName];
    if (!method) {
      throw new Error('Method "' + methodName + '" was configured as an event handler, but does not exist.');
    }

    target[actionName](entity, evt, method);
  });
}

// generic looping function
function iterateEvents(target, entity, bindings, actionName) {
  // type-check bindings
  if (!_.isObject(bindings)) {
    throw new Error({
      message: 'Bindings must be an object.',
      url: 'marionette.functions.html#marionettebindevents'
    });
  }

  // iterate the bindings and bind/unbind them
  _.each(bindings, function (method, evt) {

    // allow for a list of method names as a string
    if (_.isString(method)) {
      bindFromStrings(target, entity, evt, method, actionName);
      return;
    }

    target[actionName](entity, evt, method);
  });
}

function bindEvents(entity, bindings) {
  if (!entity || !bindings) {
    return this;
  }

  iterateEvents(this, entity, bindings, 'listenTo');
  return this;
}

function unbindEvents(entity, bindings) {
  if (!entity) {
    return this;
  }

  if (!bindings) {
    this.stopListening(entity);
    return this;
  }

  iterateEvents(this, entity, bindings, 'stopListening');
  return this;
}

var mixin = {
  initialize: function initialize(_options) {

    var options = _options || {};

    this.mapState = options.mapStateToProps || this.mapStateToProps || mapStateToProps;
    this.mapDispatch = options.mapDispatchToProps || this.mapDispatchToProps || mapDispatchToProps;
    this.mergeProps = options.mergeProps || this.mergeProps || mergeProps;
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
    } else {
      if (this.componentWillUpdate) {
        this.on('render', this.componentWillUpdate);
      }
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
    if (_.isObject(key)) {
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
        if (isDisplayComponent(this) && (this._isRendered || this.view && this.view._isRendered) && this.componentWillUpdate) {
          this.componentWillUpdate();
        }
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
    if (this.stateEvents) {
      bindEvents(this, this, this.stateEvents);
    }
  },
  unbindStateEvents: function unbindStateEvents() {
    if (this.stateEvents) {
      unbindEvents(this, this, this.stateEvents);
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

      isFunction(this.componentWillReceiveProps) && this.componentWillReceiveProps(mergedProps);

      if (isDisplayComponent(this) && (this._isRendered || this.view && this.view._isRendered) && this.componentWillUpdate) {
        this.componentWillUpdate();
      }
    }

    this.setState({
      storeState: storeState
    }, { silent: true });
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
    var componentOnRender = Component.prototype.onRender;
    var componentOnDestroy = Component.prototype.onDestroy;

    var connectMixin = _.defaults({}, {
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

        if (componentOnRender) {
          componentOnRender.apply(this, arguments);
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
}

var MarionetteRedux = {
  connect: connect,
  mixin: mixin
};

return MarionetteRedux;

})));
