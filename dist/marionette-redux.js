// Marionette Redux
// ----------------------------------
// v0.1.6
//
// Copyright (c)2016 Andrew Henderson.
// Distributed under MIT license


(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('underscore'), require('marionette')) :
	typeof define === 'function' && define.amd ? define(['underscore', 'marionette'], factory) :
	(global.MarionetteRedux = factory(global._,global.Marionette));
}(this, (function (_,Marionette) { 'use strict';

_ = 'default' in _ ? _['default'] : _;
Marionette = 'default' in Marionette ? Marionette['default'] : Marionette;

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

var _typeof$1 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function isDisplayComponent(Component) {
  if ((typeof Component === 'undefined' ? 'undefined' : _typeof$1(Component)) === 'object') {
    return Component instanceof Marionette.View || Component instanceof Marionette.Behavior;
  }
  if (typeof Component === 'function') {
    return Component.prototype instanceof Marionette.View || Component.prototype instanceof Marionette.Behavior;
  }
  return false;
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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
  },
  getState: function getState(attr) {
    return this.state[attr];
  },
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
}

var version = "0.1.6";

var MarionetteRedux = {
  connect: connect,
  mixin: mixin,
  VERSION: version
};

return MarionetteRedux;

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdoZW5kZXJzb24vU2l0ZXMvbWFyaW9uZXR0ZS1yZWR1eC9zcmMvbWFwU3RhdGVUb1Byb3BzLmpzIiwiL1VzZXJzL2FuZHJld2hlbmRlcnNvbi9TaXRlcy9tYXJpb25ldHRlLXJlZHV4L3NyYy9tYXBEaXNwYXRjaFRvUHJvcHMuanMiLCIvVXNlcnMvYW5kcmV3aGVuZGVyc29uL1NpdGVzL21hcmlvbmV0dGUtcmVkdXgvc3JjL21lcmdlUHJvcHMuanMiLCIvVXNlcnMvYW5kcmV3aGVuZGVyc29uL1NpdGVzL21hcmlvbmV0dGUtcmVkdXgvc3JjL2lzRGlzcGxheUNvbXBvbmVudC5qcyIsIi9Vc2Vycy9hbmRyZXdoZW5kZXJzb24vU2l0ZXMvbWFyaW9uZXR0ZS1yZWR1eC9zcmMvbWl4aW4uanMiLCIvVXNlcnMvYW5kcmV3aGVuZGVyc29uL1NpdGVzL21hcmlvbmV0dGUtcmVkdXgvc3JjL2Nvbm5lY3QuanMiLCIvVXNlcnMvYW5kcmV3aGVuZGVyc29uL1NpdGVzL21hcmlvbmV0dGUtcmVkdXgvc3JjL21hcmlvbmV0dGUtcmVkdXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbWFwU3RhdGVUb1Byb3BzKCkge1xuICByZXR1cm4ge31cbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIG1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaCkge1xuICByZXR1cm4ge1xuICAgIGRpc3BhdGNoOiBkaXNwYXRjaFxuICB9XG59XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIG1lcmdlUHJvcHMoc3RhdGVQcm9wcywgZGlzcGF0Y2hQcm9wcywgcGFyZW50UHJvcHMpIHtcbiAgcmV0dXJuIF8uZXh0ZW5kKHt9LCBwYXJlbnRQcm9wcywgc3RhdGVQcm9wcywgZGlzcGF0Y2hQcm9wcylcbn1cbiIsImltcG9ydCBNYXJpb25ldHRlIGZyb20gJ21hcmlvbmV0dGUnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGlzRGlzcGxheUNvbXBvbmVudChDb21wb25lbnQpIHtcbiAgaWYgKHR5cGVvZiBDb21wb25lbnQgPT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIENvbXBvbmVudCBpbnN0YW5jZW9mIE1hcmlvbmV0dGUuVmlldyB8fCBDb21wb25lbnQgaW5zdGFuY2VvZiBNYXJpb25ldHRlLkJlaGF2aW9yXG4gIH1cbiAgaWYgKHR5cGVvZiBDb21wb25lbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gQ29tcG9uZW50LnByb3RvdHlwZSBpbnN0YW5jZW9mIE1hcmlvbmV0dGUuVmlldyB8fCBDb21wb25lbnQucHJvdG90eXBlIGluc3RhbmNlb2YgTWFyaW9uZXR0ZS5CZWhhdmlvclxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgTWFyaW9uZXR0ZSBmcm9tICdtYXJpb25ldHRlJ1xuaW1wb3J0IGRlZmF1bHRNYXBTdGF0ZVRvUHJvcHMgZnJvbSAnLi9tYXBTdGF0ZVRvUHJvcHMnXG5pbXBvcnQgZGVmYXVsdE1hcERpc3BhdGNoVG9Qcm9wcyBmcm9tICcuL21hcERpc3BhdGNoVG9Qcm9wcydcbmltcG9ydCBkZWZhdWx0TWVyZ2VQcm9wcyBmcm9tICcuL21lcmdlUHJvcHMnXG5pbXBvcnQgaXNEaXNwbGF5Q29tcG9uZW50IGZyb20gJy4vaXNEaXNwbGF5Q29tcG9uZW50JztcblxuY29uc3QgbWl4aW4gPSB7XG5cbiAgaW5pdGlhbGl6ZShfb3B0aW9ucykge1xuXG4gICAgY29uc3Qgb3B0aW9ucyA9IF9vcHRpb25zIHx8IHt9O1xuXG4gICAgdGhpcy5tYXBTdGF0ZSA9IG9wdGlvbnMubWFwU3RhdGVUb1Byb3BzIHx8IHRoaXMubWFwU3RhdGVUb1Byb3BzIHx8IGRlZmF1bHRNYXBTdGF0ZVRvUHJvcHM7XG4gICAgdGhpcy5tYXBEaXNwYXRjaCA9IG9wdGlvbnMubWFwRGlzcGF0Y2hUb1Byb3BzIHx8IHRoaXMubWFwRGlzcGF0Y2hUb1Byb3BzIHx8IGRlZmF1bHRNYXBEaXNwYXRjaFRvUHJvcHM7XG4gICAgdGhpcy5tZXJnZVByb3BzID0gb3B0aW9ucy5tZXJnZVByb3BzIHx8IHRoaXMubWVyZ2VQcm9wcyB8fCBkZWZhdWx0TWVyZ2VQcm9wcztcbiAgICB0aGlzLnByb3BzID0gdGhpcy5wcm9wcyB8fCB7fTtcblxuICAgIGlmIChvcHRpb25zLnByb3BzKSB7XG4gICAgICBfLmV4dGVuZCh0aGlzLnByb3BzLCBvcHRpb25zLnByb3BzKVxuICAgIH1cblxuICAgIHRoaXMuc3RvcmUgPSBvcHRpb25zLnN0b3JlIHx8IHRoaXMuc3RvcmVcblxuICAgIGlmICghdGhpcy5zdG9yZSAmJiB3aW5kb3cgJiYgd2luZG93LnN0b3JlKSB7XG4gICAgICB0aGlzLnN0b3JlID0gd2luZG93LnN0b3JlXG4gICAgfVxuXG4gICAgY29uc3Qgc3RvcmVTdGF0ZSA9IHRoaXMuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICB0aGlzLnN0YXRlID0gXy5kZWZhdWx0cyh7XG4gICAgICBzdG9yZVN0YXRlOiBzdG9yZVN0YXRlXG4gICAgfSwgdGhpcy5nZXRJbml0aWFsU3RhdGUoKSk7XG5cbiAgICB0aGlzLmJpbmRTdGF0ZUV2ZW50cygpO1xuICAgIHRoaXMuY2xlYXJDYWNoZSgpO1xuXG4gICAgaWYgKCFpc0Rpc3BsYXlDb21wb25lbnQodGhpcykpIHtcbiAgICAgIHRoaXMudHJ5U3Vic2NyaWJlKClcbiAgICB9XG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlKCkge1xuICAgIHJldHVybiB7fVxuICB9LFxuXG4gIHNldFN0YXRlKGtleSwgdmFsLCBvcHRpb25zKSB7XG5cbiAgICBpZiAoa2V5ID09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBib3RoIGBcImtleVwiLCB2YWx1ZWAgYW5kIGB7a2V5OiB2YWx1ZX1gIC1zdHlsZSBhcmd1bWVudHMuXG4gICAgbGV0IHN0YXRlO1xuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0Jykge1xuICAgICAgc3RhdGUgPSBrZXk7XG4gICAgICBvcHRpb25zID0gdmFsO1xuICAgIH0gZWxzZSB7XG4gICAgICAoc3RhdGUgPSB7fSlba2V5XSA9IHZhbDtcbiAgICB9XG5cbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuXG4gICAgLy8gRXh0cmFjdCBzdGF0ZSBhbmQgb3B0aW9ucy5cbiAgICBjb25zdCB1bnNldCAgICAgID0gb3B0aW9ucy51bnNldDtcbiAgICBjb25zdCBzaWxlbnQgICAgID0gb3B0aW9ucy5zaWxlbnQ7XG4gICAgY29uc3QgY2hhbmdlcyAgICA9IFtdO1xuICAgIGNvbnN0IGNoYW5naW5nICAgPSB0aGlzLl9jaGFuZ2luZztcbiAgICB0aGlzLl9jaGFuZ2luZyA9IHRydWU7XG5cbiAgICBpZiAoIWNoYW5naW5nKSB7XG4gICAgICB0aGlzLl9wcmV2aW91c1N0YXRlID0gXy5jbG9uZSh0aGlzLnN0YXRlKTtcbiAgICAgIHRoaXMuY2hhbmdlZCA9IHt9O1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IGNoYW5nZWQgPSB0aGlzLmNoYW5nZWQ7XG4gICAgY29uc3QgcHJldiAgICA9IHRoaXMuX3ByZXZpb3VzU3RhdGU7XG5cbiAgICAvLyBGb3IgZWFjaCBgc2V0YCBzdGF0ZSwgdXBkYXRlIG9yIGRlbGV0ZSB0aGUgY3VycmVudCB2YWx1ZS5cbiAgICBfLmVhY2goc3RhdGUsIGZ1bmN0aW9uKF92YWwsIF9rZXkpIHtcbiAgICAgIGlmICghXy5pc0VxdWFsKGN1cnJlbnRbX2tleV0sIF92YWwpKSB7XG4gICAgICAgIGNoYW5nZXMucHVzaChfa2V5KTtcbiAgICAgIH1cbiAgICAgIGlmICghXy5pc0VxdWFsKHByZXZbX2tleV0sIF92YWwpKSB7XG4gICAgICAgIGNoYW5nZWRbX2tleV0gPSBfdmFsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVsZXRlIGNoYW5nZWRbX2tleV07XG4gICAgICB9XG4gICAgICB1bnNldCA/IGRlbGV0ZSBjdXJyZW50W19rZXldIDogY3VycmVudFtfa2V5XSA9IF92YWw7XG4gICAgfSk7XG5cbiAgICAvLyBUcmlnZ2VyIGFsbCByZWxldmFudCBzdGF0ZSBjaGFuZ2VzLlxuICAgIGlmICghc2lsZW50KSB7XG4gICAgICBpZiAoY2hhbmdlcy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5fcGVuZGluZyA9IG9wdGlvbnM7XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdjaGFuZ2U6JyArIGNoYW5nZXNbaV0sIHRoaXMsIGN1cnJlbnRbY2hhbmdlc1tpXV0sIG9wdGlvbnMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFlvdSBtaWdodCBiZSB3b25kZXJpbmcgd2h5IHRoZXJlJ3MgYSBgd2hpbGVgIGxvb3AgaGVyZS4gQ2hhbmdlcyBjYW5cbiAgICAvLyBiZSByZWN1cnNpdmVseSBuZXN0ZWQgd2l0aGluIGBcImNoYW5nZVwiYCBldmVudHMuXG4gICAgaWYgKGNoYW5naW5nKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgIHdoaWxlICh0aGlzLl9wZW5kaW5nKSB7XG4gICAgICAgIG9wdGlvbnMgPSB0aGlzLl9wZW5kaW5nO1xuICAgICAgICB0aGlzLl9wZW5kaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMudHJpZ2dlcignY2hhbmdlJywgdGhpcywgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX3BlbmRpbmcgPSBmYWxzZTtcbiAgICB0aGlzLl9jaGFuZ2luZyA9IGZhbHNlO1xuICAgIHJldHVybiB0aGlzXG4gIH0sXG5cbiAgZ2V0U3RhdGUoYXR0cikge1xuICAgIHJldHVybiB0aGlzLnN0YXRlW2F0dHJdXG4gIH0sXG5cbiAgYmluZFN0YXRlRXZlbnRzKCkge1xuICAgIGxldCBiaW5kO1xuICAgIGlmICh0aGlzLnN0YXRlRXZlbnRzKSB7XG4gICAgICBiaW5kID0gTWFyaW9uZXR0ZS5iaW5kRXZlbnRzIHx8IE1hcmlvbmV0dGUuYmluZEVudGl0eUV2ZW50cztcbiAgICAgIGJpbmQodGhpcywgdGhpcywgdGhpcy5zdGF0ZUV2ZW50cylcbiAgICB9XG4gIH0sXG5cbiAgdW5iaW5kU3RhdGVFdmVudHMoKSB7XG4gICAgbGV0IHVuYmluZDtcbiAgICBpZiAodGhpcy5zdGF0ZUV2ZW50cykge1xuICAgICAgdW5iaW5kID0gTWFyaW9uZXR0ZS51bmJpbmRFdmVudHMgfHwgTWFyaW9uZXR0ZS51bmJpbmRFbnRpdHlFdmVudHM7XG4gICAgICB1bmJpbmQodGhpcywgdGhpcywgdGhpcy5zdGF0ZUV2ZW50cylcbiAgICB9XG4gIH0sXG5cbiAgY29tcHV0ZVN0YXRlUHJvcHMoc3RvcmUsIHByb3BzKSB7XG4gICAgaWYgKCF0aGlzLmZpbmFsTWFwU3RhdGVUb1Byb3BzKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb25maWd1cmVGaW5hbE1hcFN0YXRlKHN0b3JlLCBwcm9wcylcbiAgICB9XG5cbiAgICBjb25zdCBzdGF0ZSA9IHN0b3JlLmdldFN0YXRlKCk7XG4gICAgY29uc3Qgc3RhdGVQcm9wcyA9IHRoaXMuZG9TdGF0ZVByb3BzRGVwZW5kT25Pd25Qcm9wcyA/XG4gICAgICB0aGlzLmZpbmFsTWFwU3RhdGVUb1Byb3BzKHN0YXRlLCBwcm9wcykgOlxuICAgICAgdGhpcy5maW5hbE1hcFN0YXRlVG9Qcm9wcyhzdGF0ZSk7XG5cbiAgICByZXR1cm4gc3RhdGVQcm9wc1xuICB9LFxuXG4gIGNvbmZpZ3VyZUZpbmFsTWFwU3RhdGUoc3RvcmUsIHByb3BzKSB7XG4gICAgY29uc3QgbWFwcGVkU3RhdGUgPSB0aGlzLm1hcFN0YXRlKHN0b3JlLmdldFN0YXRlKCksIHByb3BzKTtcbiAgICBjb25zdCBpc0ZhY3RvcnkgPSBfLmlzRnVuY3Rpb24obWFwcGVkU3RhdGUpO1xuXG4gICAgdGhpcy5maW5hbE1hcFN0YXRlVG9Qcm9wcyA9IGlzRmFjdG9yeSA/IG1hcHBlZFN0YXRlIDogdGhpcy5tYXBTdGF0ZTtcbiAgICB0aGlzLmRvU3RhdGVQcm9wc0RlcGVuZE9uT3duUHJvcHMgPSB0aGlzLmZpbmFsTWFwU3RhdGVUb1Byb3BzLmxlbmd0aCAhPT0gMTtcblxuICAgIGlmIChpc0ZhY3RvcnkpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVTdGF0ZVByb3BzKHN0b3JlLCBwcm9wcylcbiAgICB9XG5cbiAgICByZXR1cm4gbWFwcGVkU3RhdGVcbiAgfSxcblxuICB1cGRhdGVTdGF0ZVByb3BzSWZOZWVkZWQoKSB7XG4gICAgY29uc3QgbmV4dFN0YXRlUHJvcHMgPSB0aGlzLmNvbXB1dGVTdGF0ZVByb3BzKHRoaXMuc3RvcmUsIHRoaXMucHJvcHMpO1xuICAgIGlmICh0aGlzLnN0YXRlUHJvcHMgJiYgXy5pc0VxdWFsKG5leHRTdGF0ZVByb3BzLCB0aGlzLnN0YXRlUHJvcHMpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICB0aGlzLnN0YXRlUHJvcHMgPSBuZXh0U3RhdGVQcm9wcztcblxuICAgIHJldHVybiB0cnVlXG4gIH0sXG5cbiAgY29tcHV0ZURpc3BhdGNoUHJvcHMoc3RvcmUsIHByb3BzKSB7XG4gICAgaWYgKCF0aGlzLmZpbmFsTWFwRGlzcGF0Y2hUb1Byb3BzKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb25maWd1cmVGaW5hbE1hcERpc3BhdGNoKHN0b3JlLCBwcm9wcylcbiAgICB9XG5cbiAgICBjb25zdCBkaXNwYXRjaCA9IHN0b3JlLmRpc3BhdGNoO1xuICAgIGNvbnN0IGRpc3BhdGNoUHJvcHMgPSB0aGlzLmRvRGlzcGF0Y2hQcm9wc0RlcGVuZE9uT3duUHJvcHMgP1xuICAgICAgdGhpcy5maW5hbE1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaCwgcHJvcHMpIDpcbiAgICAgIHRoaXMuZmluYWxNYXBEaXNwYXRjaFRvUHJvcHMoZGlzcGF0Y2gpO1xuXG4gICAgcmV0dXJuIGRpc3BhdGNoUHJvcHNcbiAgfSxcblxuICBjb25maWd1cmVGaW5hbE1hcERpc3BhdGNoKHN0b3JlLCBwcm9wcykge1xuICAgIGNvbnN0IG1hcHBlZERpc3BhdGNoID0gdGhpcy5tYXBEaXNwYXRjaChzdG9yZS5kaXNwYXRjaCwgcHJvcHMpO1xuICAgIGNvbnN0IGlzRmFjdG9yeSA9IF8uaXNGdW5jdGlvbihtYXBwZWREaXNwYXRjaCk7XG5cbiAgICB0aGlzLmZpbmFsTWFwRGlzcGF0Y2hUb1Byb3BzID0gaXNGYWN0b3J5ID8gbWFwcGVkRGlzcGF0Y2ggOiB0aGlzLm1hcERpc3BhdGNoO1xuICAgIHRoaXMuZG9EaXNwYXRjaFByb3BzRGVwZW5kT25Pd25Qcm9wcyA9IHRoaXMuZmluYWxNYXBEaXNwYXRjaFRvUHJvcHMubGVuZ3RoICE9PSAxO1xuXG4gICAgaWYgKGlzRmFjdG9yeSkge1xuICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZURpc3BhdGNoUHJvcHMoc3RvcmUsIHByb3BzKVxuICAgIH1cblxuICAgIHJldHVybiBtYXBwZWREaXNwYXRjaFxuICB9LFxuXG4gIHVwZGF0ZURpc3BhdGNoUHJvcHNJZk5lZWRlZCgpIHtcbiAgICBjb25zdCBuZXh0RGlzcGF0Y2hQcm9wcyA9IHRoaXMuY29tcHV0ZURpc3BhdGNoUHJvcHModGhpcy5zdG9yZSwgdGhpcy5wcm9wcyk7XG4gICAgaWYgKHRoaXMuZGlzcGF0Y2hQcm9wcyAmJiBfLmlzRXF1YWwobmV4dERpc3BhdGNoUHJvcHMsIHRoaXMuZGlzcGF0Y2hQcm9wcykpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHRoaXMuZGlzcGF0Y2hQcm9wcyA9IG5leHREaXNwYXRjaFByb3BzO1xuXG4gICAgcmV0dXJuIHRydWVcbiAgfSxcblxuICBpc1N1YnNjcmliZWQoKSB7XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih0aGlzLnVuc3Vic2NyaWJlKVxuICB9LFxuXG4gIHRyeVN1YnNjcmliZSgpIHtcbiAgICBpZiAoIXRoaXMuaXNTdWJzY3JpYmVkKCkpIHtcbiAgICAgIHRoaXMudW5zdWJzY3JpYmUgPSB0aGlzLnN0b3JlLnN1YnNjcmliZSh0aGlzLmhhbmRsZUNoYW5nZS5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuaGFuZGxlRGlzcGF0Y2hQcm9wcygpO1xuICAgICAgdGhpcy5oYW5kbGVDaGFuZ2UoKVxuICAgIH1cbiAgfSxcblxuICB0cnlVbnN1YnNjcmliZSgpIHtcbiAgICBpZiAodGhpcy51bnN1YnNjcmliZSkge1xuICAgICAgdGhpcy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy51bnN1YnNjcmliZSA9IG51bGxcbiAgICB9XG4gIH0sXG5cbiAgb25SZW5kZXIoKSB7XG4gICAgdGhpcy50cnlTdWJzY3JpYmUoKVxuICB9LFxuXG4gIG9uRGVzdHJveSgpIHtcbiAgICB0aGlzLnRyeVVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy51bmJpbmRTdGF0ZUV2ZW50cygpO1xuICAgIHRoaXMuY2xlYXJDYWNoZSgpXG4gIH0sXG5cbiAgY2xlYXJDYWNoZSgpIHtcbiAgICB0aGlzLmRpc3BhdGNoUHJvcHMgPSBudWxsO1xuICAgIHRoaXMuc3RhdGVQcm9wcyA9IG51bGw7XG4gICAgdGhpcy5maW5hbE1hcERpc3BhdGNoVG9Qcm9wcyA9IG51bGw7XG4gICAgdGhpcy5maW5hbE1hcFN0YXRlVG9Qcm9wcyA9IG51bGw7XG4gICAgdGhpcy5oYXZlSW5pdGlhbFN0YXRlUHJvcHNCZWVuRGV0ZXJtaW5lZCA9IGZhbHNlO1xuICAgIHRoaXMuaGF2ZUluaXRpYWxEaXNwYXRjaFByb3BzQmVlbkRldGVybWluZWQgPSBmYWxzZVxuICB9LFxuXG4gIGhhbmRsZURpc3BhdGNoUHJvcHMoKSB7XG4gICAgaWYgKCF0aGlzLmhhdmVJbml0aWFsRGlzcGF0Y2hQcm9wc0JlZW5EZXRlcm1pbmVkKSB7XG4gICAgICB0aGlzLnVwZGF0ZURpc3BhdGNoUHJvcHNJZk5lZWRlZCgpO1xuICAgICAgdGhpcy5oYXZlSW5pdGlhbERpc3BhdGNoUHJvcHNCZWVuRGV0ZXJtaW5lZCA9IHRydWVcbiAgICB9XG4gIH0sXG5cbiAgaGFuZGxlQ2hhbmdlKCkge1xuICAgIGlmICghdGhpcy51bnN1YnNjcmliZSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3Qgc3RvcmVTdGF0ZSA9IHRoaXMuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBwcmV2U3RvcmVTdGF0ZSA9IHRoaXMuZ2V0U3RhdGUoJ3N0b3JlU3RhdGUnKTtcbiAgICBpZiAodGhpcy5oYXZlSW5pdGlhbFN0YXRlUHJvcHNCZWVuRGV0ZXJtaW5lZCAmJiBfLmlzRXF1YWwocHJldlN0b3JlU3RhdGUsIHN0b3JlU3RhdGUpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBoYXZlU3RhdGVQcm9wc0NoYW5nZWQgPSB0aGlzLnVwZGF0ZVN0YXRlUHJvcHNJZk5lZWRlZCgpO1xuICAgIHRoaXMuaGF2ZUluaXRpYWxTdGF0ZVByb3BzQmVlbkRldGVybWluZWQgPSB0cnVlO1xuXG4gICAgaWYgKGhhdmVTdGF0ZVByb3BzQ2hhbmdlZCkge1xuXG4gICAgICBjb25zdCBtZXJnZWRQcm9wcyA9IHRoaXMubWVyZ2VQcm9wcyh0aGlzLnN0YXRlUHJvcHMsIHRoaXMuZGlzcGF0Y2hQcm9wcywgdGhpcy5wcm9wcyk7XG4gICAgICB0aGlzLnByb3BzID0gbWVyZ2VkUHJvcHM7XG5cbiAgICAgIF8uaXNGdW5jdGlvbih0aGlzLmNvbXBvbmVudERpZFJlY2VpdmVQcm9wcykgJiYgdGhpcy5jb21wb25lbnREaWRSZWNlaXZlUHJvcHMobWVyZ2VkUHJvcHMpXG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBzdG9yZVN0YXRlXG4gICAgfSlcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgbWl4aW47XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBkZWZhdWx0TWFwU3RhdGVUb1Byb3BzIGZyb20gJy4vbWFwU3RhdGVUb1Byb3BzJ1xuaW1wb3J0IGRlZmF1bHRNYXBEaXNwYXRjaFRvUHJvcHMgZnJvbSAnLi9tYXBEaXNwYXRjaFRvUHJvcHMnXG5pbXBvcnQgZGVmYXVsdE1lcmdlUHJvcHMgZnJvbSAnLi9tZXJnZVByb3BzJ1xuaW1wb3J0IG1peGluIGZyb20gJy4vbWl4aW4nXG5pbXBvcnQgaXNEaXNwbGF5Q29tcG9uZW50IGZyb20gJy4vaXNEaXNwbGF5Q29tcG9uZW50JztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY29ubmVjdChfbWFwU3RhdGVUb1Byb3BzLCBfbWFwRGlzcGF0Y2hUb1Byb3BzLCBfbWVyZ2VQcm9wcywgX29wdGlvbnMpIHtcblxuICBjb25zdCBvcHRpb25zID0gX29wdGlvbnMgfHwge307XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKENvbXBvbmVudCkge1xuXG4gICAgY29uc3QgbWFwU3RhdGVUb1Byb3BzID0gX21hcFN0YXRlVG9Qcm9wcyB8fCBDb21wb25lbnQucHJvdG90eXBlLm1hcFN0YXRlVG9Qcm9wcyB8fCBkZWZhdWx0TWFwU3RhdGVUb1Byb3BzO1xuICAgIGNvbnN0IG1hcERpc3BhdGNoVG9Qcm9wcyA9IF9tYXBEaXNwYXRjaFRvUHJvcHMgfHwgQ29tcG9uZW50LnByb3RvdHlwZS5tYXBEaXNwYXRjaFRvUHJvcHMgfHwgZGVmYXVsdE1hcERpc3BhdGNoVG9Qcm9wcztcbiAgICBjb25zdCBtZXJnZVByb3BzID0gX21lcmdlUHJvcHMgfHwgQ29tcG9uZW50LnByb3RvdHlwZS5tZXJnZVByb3BzIHx8IGRlZmF1bHRNZXJnZVByb3BzO1xuICAgIGNvbnN0IHN0b3JlID0gb3B0aW9ucy5zdG9yZSB8fCBDb21wb25lbnQucHJvdG90eXBlLnN0b3JlO1xuICAgIGNvbnN0IGNvbXBvbmVudEluaXRpYWxpemUgPSBDb21wb25lbnQucHJvdG90eXBlLmluaXRpYWxpemU7XG4gICAgY29uc3QgY29tcG9uZW50b25SZW5kZXIgPSBDb21wb25lbnQucHJvdG90eXBlLm9uUmVuZGVyO1xuICAgIGNvbnN0IGNvbXBvbmVudE9uRGVzdHJveSA9IENvbXBvbmVudC5wcm90b3R5cGUub25EZXN0cm95O1xuXG4gICAgbGV0IGNvbm5lY3RNaXhpbiA9IF8uZGVmYXVsdHMoe30sIHtcblxuICAgICAgaW5pdGlhbGl6ZShfaW5pdE9wdGlvbnMpIHtcblxuICAgICAgICBjb25zdCBpbml0T3B0aW9ucyA9IF9pbml0T3B0aW9ucyB8fCB7fTtcblxuICAgICAgICBtaXhpbi5pbml0aWFsaXplLmNhbGwodGhpcywge1xuICAgICAgICAgIG1hcFN0YXRlVG9Qcm9wcyxcbiAgICAgICAgICBtYXBEaXNwYXRjaFRvUHJvcHMsXG4gICAgICAgICAgbWVyZ2VQcm9wcyxcbiAgICAgICAgICBzdG9yZSxcbiAgICAgICAgICBwcm9wczogaW5pdE9wdGlvbnMucHJvcHNcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGNvbXBvbmVudEluaXRpYWxpemUpIHtcbiAgICAgICAgICBjb21wb25lbnRJbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIG9uUmVuZGVyKCkge1xuXG4gICAgICAgIG1peGluLm9uUmVuZGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgaWYgKGNvbXBvbmVudG9uUmVuZGVyKSB7XG4gICAgICAgICAgY29tcG9uZW50b25SZW5kZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBvbkRlc3Ryb3koKSB7XG5cbiAgICAgICAgbWl4aW4ub25EZXN0cm95LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgaWYgKGNvbXBvbmVudE9uRGVzdHJveSkge1xuICAgICAgICAgIGNvbXBvbmVudE9uRGVzdHJveS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwgbWl4aW4pO1xuXG4gICAgaWYgKCFpc0Rpc3BsYXlDb21wb25lbnQoQ29tcG9uZW50KSkge1xuICAgICAgY29ubmVjdE1peGluID0gXy5vbWl0KGNvbm5lY3RNaXhpbiwgJ29uUmVuZGVyJylcbiAgICB9XG5cbiAgICByZXR1cm4gQ29tcG9uZW50LmV4dGVuZChjb25uZWN0TWl4aW4pXG4gIH1cbn1cbiIsImltcG9ydCBjb25uZWN0IGZyb20gJy4vY29ubmVjdCdcbmltcG9ydCBtaXhpbiBmcm9tICcuL21peGluJ1xuaW1wb3J0IHsgdmVyc2lvbiBhcyBWRVJTSU9OIH0gZnJvbSAnLi4vcGFja2FnZS5qc29uJ1xuXG5jb25zdCBNYXJpb25ldHRlUmVkdXggPSB7XG4gIGNvbm5lY3QsXG4gIG1peGluLFxuICBWRVJTSU9OXG59XG5cbmV4cG9ydCBkZWZhdWx0IE1hcmlvbmV0dGVSZWR1eFxuIl0sIm5hbWVzIjpbIm1hcFN0YXRlVG9Qcm9wcyIsIm1hcERpc3BhdGNoVG9Qcm9wcyIsImRpc3BhdGNoIiwibWVyZ2VQcm9wcyIsInN0YXRlUHJvcHMiLCJkaXNwYXRjaFByb3BzIiwicGFyZW50UHJvcHMiLCJfIiwiZXh0ZW5kIiwiaXNEaXNwbGF5Q29tcG9uZW50IiwiQ29tcG9uZW50IiwiTWFyaW9uZXR0ZSIsIlZpZXciLCJCZWhhdmlvciIsInByb3RvdHlwZSIsIm1peGluIiwiX29wdGlvbnMiLCJvcHRpb25zIiwibWFwU3RhdGUiLCJkZWZhdWx0TWFwU3RhdGVUb1Byb3BzIiwibWFwRGlzcGF0Y2giLCJkZWZhdWx0TWFwRGlzcGF0Y2hUb1Byb3BzIiwiZGVmYXVsdE1lcmdlUHJvcHMiLCJwcm9wcyIsInN0b3JlIiwid2luZG93Iiwic3RvcmVTdGF0ZSIsImdldFN0YXRlIiwic3RhdGUiLCJkZWZhdWx0cyIsImdldEluaXRpYWxTdGF0ZSIsImJpbmRTdGF0ZUV2ZW50cyIsImNsZWFyQ2FjaGUiLCJ0cnlTdWJzY3JpYmUiLCJrZXkiLCJ2YWwiLCJ1bnNldCIsInNpbGVudCIsImNoYW5nZXMiLCJjaGFuZ2luZyIsIl9jaGFuZ2luZyIsIl9wcmV2aW91c1N0YXRlIiwiY2xvbmUiLCJjaGFuZ2VkIiwiY3VycmVudCIsInByZXYiLCJlYWNoIiwiX3ZhbCIsIl9rZXkiLCJpc0VxdWFsIiwicHVzaCIsImxlbmd0aCIsIl9wZW5kaW5nIiwiaSIsInRyaWdnZXIiLCJhdHRyIiwiYmluZCIsInN0YXRlRXZlbnRzIiwiYmluZEV2ZW50cyIsImJpbmRFbnRpdHlFdmVudHMiLCJ1bmJpbmQiLCJ1bmJpbmRFdmVudHMiLCJ1bmJpbmRFbnRpdHlFdmVudHMiLCJmaW5hbE1hcFN0YXRlVG9Qcm9wcyIsImNvbmZpZ3VyZUZpbmFsTWFwU3RhdGUiLCJkb1N0YXRlUHJvcHNEZXBlbmRPbk93blByb3BzIiwibWFwcGVkU3RhdGUiLCJpc0ZhY3RvcnkiLCJpc0Z1bmN0aW9uIiwiY29tcHV0ZVN0YXRlUHJvcHMiLCJuZXh0U3RhdGVQcm9wcyIsImZpbmFsTWFwRGlzcGF0Y2hUb1Byb3BzIiwiY29uZmlndXJlRmluYWxNYXBEaXNwYXRjaCIsImRvRGlzcGF0Y2hQcm9wc0RlcGVuZE9uT3duUHJvcHMiLCJtYXBwZWREaXNwYXRjaCIsImNvbXB1dGVEaXNwYXRjaFByb3BzIiwibmV4dERpc3BhdGNoUHJvcHMiLCJ1bnN1YnNjcmliZSIsImlzU3Vic2NyaWJlZCIsInN1YnNjcmliZSIsImhhbmRsZUNoYW5nZSIsImhhbmRsZURpc3BhdGNoUHJvcHMiLCJ0cnlVbnN1YnNjcmliZSIsInVuYmluZFN0YXRlRXZlbnRzIiwiaGF2ZUluaXRpYWxTdGF0ZVByb3BzQmVlbkRldGVybWluZWQiLCJoYXZlSW5pdGlhbERpc3BhdGNoUHJvcHNCZWVuRGV0ZXJtaW5lZCIsInVwZGF0ZURpc3BhdGNoUHJvcHNJZk5lZWRlZCIsInByZXZTdG9yZVN0YXRlIiwiaGF2ZVN0YXRlUHJvcHNDaGFuZ2VkIiwidXBkYXRlU3RhdGVQcm9wc0lmTmVlZGVkIiwibWVyZ2VkUHJvcHMiLCJjb21wb25lbnREaWRSZWNlaXZlUHJvcHMiLCJzZXRTdGF0ZSIsImNvbm5lY3QiLCJfbWFwU3RhdGVUb1Byb3BzIiwiX21hcERpc3BhdGNoVG9Qcm9wcyIsIl9tZXJnZVByb3BzIiwiY29tcG9uZW50SW5pdGlhbGl6ZSIsImluaXRpYWxpemUiLCJjb21wb25lbnRvblJlbmRlciIsIm9uUmVuZGVyIiwiY29tcG9uZW50T25EZXN0cm95Iiwib25EZXN0cm95IiwiY29ubmVjdE1peGluIiwiX2luaXRPcHRpb25zIiwiaW5pdE9wdGlvbnMiLCJjYWxsIiwiYXBwbHkiLCJhcmd1bWVudHMiLCJvbWl0IiwiTWFyaW9uZXR0ZVJlZHV4Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFlLFNBQVNBLGVBQVQsR0FBMkI7U0FDakMsRUFBUDs7O0FDRGEsU0FBU0Msa0JBQVQsQ0FBNEJDLFFBQTVCLEVBQXNDO1NBQzVDO2NBQ0tBO0dBRFo7OztBQ0FhLFNBQVNDLFVBQVQsQ0FBb0JDLFVBQXBCLEVBQWdDQyxhQUFoQyxFQUErQ0MsV0FBL0MsRUFBNEQ7U0FDbEVDLEVBQUVDLE1BQUYsQ0FBUyxFQUFULEVBQWFGLFdBQWIsRUFBMEJGLFVBQTFCLEVBQXNDQyxhQUF0QyxDQUFQOzs7OztBQ0ZGLEFBRUEsQUFBZSxTQUFTSSxrQkFBVCxDQUE0QkMsU0FBNUIsRUFBdUM7TUFDaEQsUUFBT0EsU0FBUCwyQ0FBT0EsU0FBUCxPQUFxQixRQUF6QixFQUFtQztXQUMxQkEscUJBQXFCQyxXQUFXQyxJQUFoQyxJQUF3Q0YscUJBQXFCQyxXQUFXRSxRQUEvRTs7TUFFRSxPQUFPSCxTQUFQLEtBQXFCLFVBQXpCLEVBQXFDO1dBQzVCQSxVQUFVSSxTQUFWLFlBQStCSCxXQUFXQyxJQUExQyxJQUFrREYsVUFBVUksU0FBVixZQUErQkgsV0FBV0UsUUFBbkc7O1NBRUssS0FBUDs7Ozs7QUNURixBQUNBLEFBQ0EsQUFDQSxBQUNBLEFBQ0EsQUFFQSxJQUFNRSxRQUFRO1lBQUEsc0JBRURDLFFBRkMsRUFFUzs7UUFFYkMsVUFBVUQsWUFBWSxFQUE1Qjs7U0FFS0UsUUFBTCxHQUFnQkQsUUFBUWpCLGVBQVIsSUFBMkIsS0FBS0EsZUFBaEMsSUFBbURtQixlQUFuRTtTQUNLQyxX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