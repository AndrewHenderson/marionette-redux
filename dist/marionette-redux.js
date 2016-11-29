// Marionette Redux
// ----------------------------------
// v0.1.0
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
    }, this.state);
    this.bindStateEvents();
    this.clearCache();
    if (!(this instanceof Marionette.View) && !(this instanceof Marionette.Behavior)) {
      this.trySubscribe();
    }
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

    return Component.extend(connectMixin);
  };
});

exports.connect = connect;
exports.mixin = mixin;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdoZW5kZXJzb24vbWFyaW9uZXR0ZS1yZWR1eC9zcmMvbWFwU3RhdGVUb1Byb3BzLmpzIiwiL1VzZXJzL2FuZHJld2hlbmRlcnNvbi9tYXJpb25ldHRlLXJlZHV4L3NyYy9tYXBEaXNwYXRjaFRvUHJvcHMuanMiLCIvVXNlcnMvYW5kcmV3aGVuZGVyc29uL21hcmlvbmV0dGUtcmVkdXgvc3JjL21lcmdlUHJvcHMuanMiLCIvVXNlcnMvYW5kcmV3aGVuZGVyc29uL21hcmlvbmV0dGUtcmVkdXgvc3JjL3NldFN0YXRlLmpzIiwiL1VzZXJzL2FuZHJld2hlbmRlcnNvbi9tYXJpb25ldHRlLXJlZHV4L3NyYy9nZXRTdGF0ZS5qcyIsIi9Vc2Vycy9hbmRyZXdoZW5kZXJzb24vbWFyaW9uZXR0ZS1yZWR1eC9zcmMvbWl4aW4uanMiLCIvVXNlcnMvYW5kcmV3aGVuZGVyc29uL21hcmlvbmV0dGUtcmVkdXgvc3JjL2Nvbm5lY3QuanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGRlZmF1bHQgc3RhdGUgPT4gKHt9KVxuIiwiZXhwb3J0IGRlZmF1bHQgZGlzcGF0Y2ggPT4gKHsgZGlzcGF0Y2ggfSlcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuZXhwb3J0IGRlZmF1bHQgKHN0YXRlUHJvcHMsIGRpc3BhdGNoUHJvcHMsIHBhcmVudFByb3BzKSA9PiAoXG4gIF8uZXh0ZW5kKHt9LCBwYXJlbnRQcm9wcywgc3RhdGVQcm9wcywgZGlzcGF0Y2hQcm9wcylcbilcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihrZXksIHZhbCwgb3B0aW9ucykge1xuXG4gIGlmIChrZXkgPT0gbnVsbCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gSGFuZGxlIGJvdGggYFwia2V5XCIsIHZhbHVlYCBhbmQgYHtrZXk6IHZhbHVlfWAgLXN0eWxlIGFyZ3VtZW50cy5cbiAgbGV0IHN0YXRlO1xuICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICBzdGF0ZSA9IGtleTtcbiAgICBvcHRpb25zID0gdmFsO1xuICB9IGVsc2Uge1xuICAgIChzdGF0ZSA9IHt9KVtrZXldID0gdmFsO1xuICB9XG5cbiAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcblxuICAvLyBFeHRyYWN0IHN0YXRlIGFuZCBvcHRpb25zLlxuICBjb25zdCB1bnNldCAgICAgID0gb3B0aW9ucy51bnNldDtcbiAgY29uc3Qgc2lsZW50ICAgICA9IG9wdGlvbnMuc2lsZW50O1xuICBjb25zdCBjaGFuZ2VzICAgID0gW107XG4gIGNvbnN0IGNoYW5naW5nICAgPSB0aGlzLl9jaGFuZ2luZztcbiAgdGhpcy5fY2hhbmdpbmcgPSB0cnVlO1xuXG4gIGlmICghY2hhbmdpbmcpIHtcbiAgICB0aGlzLl9wcmV2aW91c1N0YXRlID0gXy5jbG9uZSh0aGlzLnN0YXRlKTtcbiAgICB0aGlzLmNoYW5nZWQgPSB7fTtcbiAgfVxuXG4gIGNvbnN0IGN1cnJlbnQgPSB0aGlzLnN0YXRlO1xuICBjb25zdCBjaGFuZ2VkID0gdGhpcy5jaGFuZ2VkO1xuICBjb25zdCBwcmV2ICAgID0gdGhpcy5fcHJldmlvdXNTdGF0ZTtcblxuICAvLyBGb3IgZWFjaCBgc2V0YCBzdGF0ZSwgdXBkYXRlIG9yIGRlbGV0ZSB0aGUgY3VycmVudCB2YWx1ZS5cbiAgXy5lYWNoKHN0YXRlLCBmdW5jdGlvbihfdmFsLCBfa2V5KSB7XG4gICAgaWYgKCFfLmlzRXF1YWwoY3VycmVudFtfa2V5XSwgX3ZhbCkpIHtcbiAgICAgIGNoYW5nZXMucHVzaChfa2V5KTtcbiAgICB9XG4gICAgaWYgKCFfLmlzRXF1YWwocHJldltfa2V5XSwgX3ZhbCkpIHtcbiAgICAgIGNoYW5nZWRbX2tleV0gPSBfdmFsO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWxldGUgY2hhbmdlZFtfa2V5XTtcbiAgICB9XG4gICAgdW5zZXQgPyBkZWxldGUgY3VycmVudFtfa2V5XSA6IGN1cnJlbnRbX2tleV0gPSBfdmFsO1xuICB9KTtcblxuICAvLyBUcmlnZ2VyIGFsbCByZWxldmFudCBzdGF0ZSBjaGFuZ2VzLlxuICBpZiAoIXNpbGVudCkge1xuICAgIGlmIChjaGFuZ2VzLmxlbmd0aCkge1xuICAgICAgdGhpcy5fcGVuZGluZyA9IG9wdGlvbnM7XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy50cmlnZ2VyKCdjaGFuZ2U6JyArIGNoYW5nZXNbaV0sIHRoaXMsIGN1cnJlbnRbY2hhbmdlc1tpXV0sIG9wdGlvbnMpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFlvdSBtaWdodCBiZSB3b25kZXJpbmcgd2h5IHRoZXJlJ3MgYSBgd2hpbGVgIGxvb3AgaGVyZS4gQ2hhbmdlcyBjYW5cbiAgLy8gYmUgcmVjdXJzaXZlbHkgbmVzdGVkIHdpdGhpbiBgXCJjaGFuZ2VcImAgZXZlbnRzLlxuICBpZiAoY2hhbmdpbmcpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBpZiAoIXNpbGVudCkge1xuICAgIHdoaWxlICh0aGlzLl9wZW5kaW5nKSB7XG4gICAgICBvcHRpb25zID0gdGhpcy5fcGVuZGluZztcbiAgICAgIHRoaXMuX3BlbmRpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMudHJpZ2dlcignY2hhbmdlJywgdGhpcywgb3B0aW9ucyk7XG4gICAgfVxuICB9XG4gIHRoaXMuX3BlbmRpbmcgPSBmYWxzZTtcbiAgdGhpcy5fY2hhbmdpbmcgPSBmYWxzZTtcbiAgcmV0dXJuIHRoaXNcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKGF0dHIpIHtcbiAgcmV0dXJuIHRoaXMuc3RhdGVbYXR0cl07XG59XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBNYXJpb25ldHRlIGZyb20gJ21hcmlvbmV0dGUnXG5pbXBvcnQgZGVmYXVsdE1hcFN0YXRlVG9Qcm9wcyBmcm9tICcuL21hcFN0YXRlVG9Qcm9wcydcbmltcG9ydCBkZWZhdWx0TWFwRGlzcGF0Y2hUb1Byb3BzIGZyb20gJy4vbWFwRGlzcGF0Y2hUb1Byb3BzJ1xuaW1wb3J0IGRlZmF1bHRNZXJnZVByb3BzIGZyb20gJy4vbWVyZ2VQcm9wcydcbmltcG9ydCBzZXRTdGF0ZSBmcm9tICcuL3NldFN0YXRlJ1xuaW1wb3J0IGdldFN0YXRlIGZyb20gJy4vZ2V0U3RhdGUnXG5cbmV4cG9ydCBkZWZhdWx0IHtcblxuICBpbml0aWFsaXplKF9vcHRpb25zKSB7XG5cbiAgICBjb25zdCBvcHRpb25zID0gX29wdGlvbnMgfHwge307XG5cbiAgICB0aGlzLm1hcFN0YXRlID0gb3B0aW9ucy5tYXBTdGF0ZVRvUHJvcHMgfHwgdGhpcy5tYXBTdGF0ZVRvUHJvcHMgfHwgZGVmYXVsdE1hcFN0YXRlVG9Qcm9wcztcbiAgICB0aGlzLm1hcERpc3BhdGNoID0gb3B0aW9ucy5tYXBEaXNwYXRjaFRvUHJvcHMgfHwgdGhpcy5tYXBEaXNwYXRjaFRvUHJvcHMgfHwgZGVmYXVsdE1hcERpc3BhdGNoVG9Qcm9wcztcbiAgICB0aGlzLm1lcmdlUHJvcHMgPSBvcHRpb25zLm1lcmdlUHJvcHMgfHwgdGhpcy5tZXJnZVByb3BzIHx8IGRlZmF1bHRNZXJnZVByb3BzO1xuICAgIHRoaXMucHJvcHMgPSB0aGlzLnByb3BzIHx8IHt9O1xuICAgIGlmIChvcHRpb25zLnByb3BzKSB7XG4gICAgICBfLmV4dGVuZCh0aGlzLnByb3BzLCBvcHRpb25zLnByb3BzKVxuICAgIH1cbiAgICB0aGlzLnN0b3JlID0gb3B0aW9ucy5zdG9yZSB8fCB0aGlzLnN0b3JlO1xuICAgIGlmICghdGhpcy5zdG9yZSAmJiB3aW5kb3cgJiYgd2luZG93LnN0b3JlKSB7XG4gICAgICB0aGlzLnN0b3JlID0gd2luZG93LnN0b3JlXG4gICAgfVxuICAgIGNvbnN0IHN0b3JlU3RhdGUgPSB0aGlzLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgdGhpcy5zdGF0ZSA9IF8uZGVmYXVsdHMoe1xuICAgICAgc3RvcmVTdGF0ZTogc3RvcmVTdGF0ZVxuICAgIH0sIHRoaXMuc3RhdGUpO1xuICAgIHRoaXMuYmluZFN0YXRlRXZlbnRzKCk7XG4gICAgdGhpcy5jbGVhckNhY2hlKCk7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIE1hcmlvbmV0dGUuVmlldykgJiYgISh0aGlzIGluc3RhbmNlb2YgTWFyaW9uZXR0ZS5CZWhhdmlvcikpIHtcbiAgICAgIHRoaXMudHJ5U3Vic2NyaWJlKClcbiAgICB9XG4gIH0sXG5cbiAgc2V0U3RhdGUsXG5cbiAgZ2V0U3RhdGUsXG5cbiAgYmluZFN0YXRlRXZlbnRzKCkge1xuICAgIGxldCBiaW5kO1xuICAgIGlmICh0aGlzLnN0YXRlRXZlbnRzKSB7XG4gICAgICBiaW5kID0gTWFyaW9uZXR0ZS5iaW5kRXZlbnRzIHx8IE1hcmlvbmV0dGUuYmluZEVudGl0eUV2ZW50cztcbiAgICAgIGJpbmQodGhpcywgdGhpcywgdGhpcy5zdGF0ZUV2ZW50cylcbiAgICB9XG4gIH0sXG5cbiAgdW5iaW5kU3RhdGVFdmVudHMoKSB7XG4gICAgbGV0IHVuYmluZDtcbiAgICBpZiAodGhpcy5zdGF0ZUV2ZW50cykge1xuICAgICAgdW5iaW5kID0gTWFyaW9uZXR0ZS51bmJpbmRFdmVudHMgfHwgTWFyaW9uZXR0ZS51bmJpbmRFbnRpdHlFdmVudHM7XG4gICAgICB1bmJpbmQodGhpcywgdGhpcywgdGhpcy5zdGF0ZUV2ZW50cylcbiAgICB9XG4gIH0sXG5cbiAgY29tcHV0ZVN0YXRlUHJvcHMoc3RvcmUsIHByb3BzKSB7XG4gICAgaWYgKCF0aGlzLmZpbmFsTWFwU3RhdGVUb1Byb3BzKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb25maWd1cmVGaW5hbE1hcFN0YXRlKHN0b3JlLCBwcm9wcylcbiAgICB9XG5cbiAgICBjb25zdCBzdGF0ZSA9IHN0b3JlLmdldFN0YXRlKCk7XG4gICAgY29uc3Qgc3RhdGVQcm9wcyA9IHRoaXMuZG9TdGF0ZVByb3BzRGVwZW5kT25Pd25Qcm9wcyA/XG4gICAgICB0aGlzLmZpbmFsTWFwU3RhdGVUb1Byb3BzKHN0YXRlLCBwcm9wcykgOlxuICAgICAgdGhpcy5maW5hbE1hcFN0YXRlVG9Qcm9wcyhzdGF0ZSk7XG5cbiAgICByZXR1cm4gc3RhdGVQcm9wc1xuICB9LFxuXG4gIGNvbmZpZ3VyZUZpbmFsTWFwU3RhdGUoc3RvcmUsIHByb3BzKSB7XG4gICAgY29uc3QgbWFwcGVkU3RhdGUgPSB0aGlzLm1hcFN0YXRlKHN0b3JlLmdldFN0YXRlKCksIHByb3BzKTtcbiAgICBjb25zdCBpc0ZhY3RvcnkgPSBfLmlzRnVuY3Rpb24obWFwcGVkU3RhdGUpO1xuXG4gICAgdGhpcy5maW5hbE1hcFN0YXRlVG9Qcm9wcyA9IGlzRmFjdG9yeSA/IG1hcHBlZFN0YXRlIDogdGhpcy5tYXBTdGF0ZTtcbiAgICB0aGlzLmRvU3RhdGVQcm9wc0RlcGVuZE9uT3duUHJvcHMgPSB0aGlzLmZpbmFsTWFwU3RhdGVUb1Byb3BzLmxlbmd0aCAhPT0gMTtcblxuICAgIGlmIChpc0ZhY3RvcnkpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVTdGF0ZVByb3BzKHN0b3JlLCBwcm9wcylcbiAgICB9XG5cbiAgICByZXR1cm4gbWFwcGVkU3RhdGVcbiAgfSxcblxuICB1cGRhdGVTdGF0ZVByb3BzSWZOZWVkZWQoKSB7XG4gICAgY29uc3QgbmV4dFN0YXRlUHJvcHMgPSB0aGlzLmNvbXB1dGVTdGF0ZVByb3BzKHRoaXMuc3RvcmUsIHRoaXMucHJvcHMpO1xuICAgIGlmICh0aGlzLnN0YXRlUHJvcHMgJiYgXy5pc0VxdWFsKG5leHRTdGF0ZVByb3BzLCB0aGlzLnN0YXRlUHJvcHMpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICB0aGlzLnN0YXRlUHJvcHMgPSBuZXh0U3RhdGVQcm9wcztcblxuICAgIHJldHVybiB0cnVlXG4gIH0sXG5cbiAgY29tcHV0ZURpc3BhdGNoUHJvcHMoc3RvcmUsIHByb3BzKSB7XG4gICAgaWYgKCF0aGlzLmZpbmFsTWFwRGlzcGF0Y2hUb1Byb3BzKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb25maWd1cmVGaW5hbE1hcERpc3BhdGNoKHN0b3JlLCBwcm9wcylcbiAgICB9XG5cbiAgICBjb25zdCBkaXNwYXRjaCA9IHN0b3JlLmRpc3BhdGNoO1xuICAgIGNvbnN0IGRpc3BhdGNoUHJvcHMgPSB0aGlzLmRvRGlzcGF0Y2hQcm9wc0RlcGVuZE9uT3duUHJvcHMgP1xuICAgICAgdGhpcy5maW5hbE1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaCwgcHJvcHMpIDpcbiAgICAgIHRoaXMuZmluYWxNYXBEaXNwYXRjaFRvUHJvcHMoZGlzcGF0Y2gpO1xuXG4gICAgcmV0dXJuIGRpc3BhdGNoUHJvcHNcbiAgfSxcblxuICBjb25maWd1cmVGaW5hbE1hcERpc3BhdGNoKHN0b3JlLCBwcm9wcykge1xuICAgIGNvbnN0IG1hcHBlZERpc3BhdGNoID0gdGhpcy5tYXBEaXNwYXRjaChzdG9yZS5kaXNwYXRjaCwgcHJvcHMpO1xuICAgIGNvbnN0IGlzRmFjdG9yeSA9IF8uaXNGdW5jdGlvbihtYXBwZWREaXNwYXRjaCk7XG5cbiAgICB0aGlzLmZpbmFsTWFwRGlzcGF0Y2hUb1Byb3BzID0gaXNGYWN0b3J5ID8gbWFwcGVkRGlzcGF0Y2ggOiB0aGlzLm1hcERpc3BhdGNoO1xuICAgIHRoaXMuZG9EaXNwYXRjaFByb3BzRGVwZW5kT25Pd25Qcm9wcyA9IHRoaXMuZmluYWxNYXBEaXNwYXRjaFRvUHJvcHMubGVuZ3RoICE9PSAxO1xuXG4gICAgaWYgKGlzRmFjdG9yeSkge1xuICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZURpc3BhdGNoUHJvcHMoc3RvcmUsIHByb3BzKVxuICAgIH1cblxuICAgIHJldHVybiBtYXBwZWREaXNwYXRjaFxuICB9LFxuXG4gIHVwZGF0ZURpc3BhdGNoUHJvcHNJZk5lZWRlZCgpIHtcbiAgICBjb25zdCBuZXh0RGlzcGF0Y2hQcm9wcyA9IHRoaXMuY29tcHV0ZURpc3BhdGNoUHJvcHModGhpcy5zdG9yZSwgdGhpcy5wcm9wcyk7XG4gICAgaWYgKHRoaXMuZGlzcGF0Y2hQcm9wcyAmJiBfLmlzRXF1YWwobmV4dERpc3BhdGNoUHJvcHMsIHRoaXMuZGlzcGF0Y2hQcm9wcykpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHRoaXMuZGlzcGF0Y2hQcm9wcyA9IG5leHREaXNwYXRjaFByb3BzO1xuXG4gICAgcmV0dXJuIHRydWVcbiAgfSxcblxuICBpc1N1YnNjcmliZWQoKSB7XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih0aGlzLnVuc3Vic2NyaWJlKVxuICB9LFxuXG4gIHRyeVN1YnNjcmliZSgpIHtcbiAgICBpZiAoIXRoaXMuaXNTdWJzY3JpYmVkKCkpIHtcbiAgICAgIHRoaXMudW5zdWJzY3JpYmUgPSB0aGlzLnN0b3JlLnN1YnNjcmliZSh0aGlzLmhhbmRsZUNoYW5nZS5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuaGFuZGxlRGlzcGF0Y2hQcm9wcygpO1xuICAgICAgdGhpcy5oYW5kbGVDaGFuZ2UoKVxuICAgIH1cbiAgfSxcblxuICB0cnlVbnN1YnNjcmliZSgpIHtcbiAgICBpZiAodGhpcy51bnN1YnNjcmliZSkge1xuICAgICAgdGhpcy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy51bnN1YnNjcmliZSA9IG51bGxcbiAgICB9XG4gIH0sXG5cbiAgb25SZW5kZXIoKSB7XG4gICAgdGhpcy50cnlTdWJzY3JpYmUoKVxuICB9LFxuXG4gIG9uRGVzdHJveSgpIHtcbiAgICB0aGlzLnRyeVVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy51bmJpbmRTdGF0ZUV2ZW50cygpO1xuICAgIHRoaXMuY2xlYXJDYWNoZSgpXG4gIH0sXG5cbiAgY2xlYXJDYWNoZSgpIHtcbiAgICB0aGlzLmRpc3BhdGNoUHJvcHMgPSBudWxsO1xuICAgIHRoaXMuc3RhdGVQcm9wcyA9IG51bGw7XG4gICAgdGhpcy5maW5hbE1hcERpc3BhdGNoVG9Qcm9wcyA9IG51bGw7XG4gICAgdGhpcy5maW5hbE1hcFN0YXRlVG9Qcm9wcyA9IG51bGw7XG4gICAgdGhpcy5oYXZlSW5pdGlhbFN0YXRlUHJvcHNCZWVuRGV0ZXJtaW5lZCA9IGZhbHNlO1xuICAgIHRoaXMuaGF2ZUluaXRpYWxEaXNwYXRjaFByb3BzQmVlbkRldGVybWluZWQgPSBmYWxzZVxuICB9LFxuXG4gIGhhbmRsZURpc3BhdGNoUHJvcHMoKSB7XG4gICAgaWYgKCF0aGlzLmhhdmVJbml0aWFsRGlzcGF0Y2hQcm9wc0JlZW5EZXRlcm1pbmVkKSB7XG4gICAgICB0aGlzLnVwZGF0ZURpc3BhdGNoUHJvcHNJZk5lZWRlZCgpO1xuICAgICAgdGhpcy5oYXZlSW5pdGlhbERpc3BhdGNoUHJvcHNCZWVuRGV0ZXJtaW5lZCA9IHRydWVcbiAgICB9XG4gIH0sXG5cbiAgaGFuZGxlQ2hhbmdlKCkge1xuICAgIGlmICghdGhpcy51bnN1YnNjcmliZSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3Qgc3RvcmVTdGF0ZSA9IHRoaXMuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBwcmV2U3RvcmVTdGF0ZSA9IHRoaXMuZ2V0U3RhdGUoJ3N0b3JlU3RhdGUnKTtcbiAgICBpZiAodGhpcy5oYXZlSW5pdGlhbFN0YXRlUHJvcHNCZWVuRGV0ZXJtaW5lZCAmJiBfLmlzRXF1YWwocHJldlN0b3JlU3RhdGUsIHN0b3JlU3RhdGUpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBoYXZlU3RhdGVQcm9wc0NoYW5nZWQgPSB0aGlzLnVwZGF0ZVN0YXRlUHJvcHNJZk5lZWRlZCgpO1xuICAgIHRoaXMuaGF2ZUluaXRpYWxTdGF0ZVByb3BzQmVlbkRldGVybWluZWQgPSB0cnVlO1xuXG4gICAgaWYgKGhhdmVTdGF0ZVByb3BzQ2hhbmdlZCkge1xuXG4gICAgICBjb25zdCBtZXJnZWRQcm9wcyA9IHRoaXMubWVyZ2VQcm9wcyh0aGlzLnN0YXRlUHJvcHMsIHRoaXMuZGlzcGF0Y2hQcm9wcywgdGhpcy5wcm9wcyk7XG4gICAgICB0aGlzLnByb3BzID0gbWVyZ2VkUHJvcHM7XG5cbiAgICAgIF8uaXNGdW5jdGlvbih0aGlzLmNvbXBvbmVudERpZFJlY2VpdmVQcm9wcykgJiYgdGhpcy5jb21wb25lbnREaWRSZWNlaXZlUHJvcHMobWVyZ2VkUHJvcHMpXG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBzdG9yZVN0YXRlXG4gICAgfSlcbiAgfVxufTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IGRlZmF1bHRNYXBTdGF0ZVRvUHJvcHMgZnJvbSAnLi9tYXBTdGF0ZVRvUHJvcHMnXG5pbXBvcnQgZGVmYXVsdE1hcERpc3BhdGNoVG9Qcm9wcyBmcm9tICcuL21hcERpc3BhdGNoVG9Qcm9wcydcbmltcG9ydCBkZWZhdWx0TWVyZ2VQcm9wcyBmcm9tICcuL21lcmdlUHJvcHMnXG5pbXBvcnQgbWl4aW4gZnJvbSAnLi9taXhpbidcblxuZXhwb3J0IGRlZmF1bHQgKF9tYXBTdGF0ZVRvUHJvcHMsIF9tYXBEaXNwYXRjaFRvUHJvcHMsIF9tZXJnZVByb3BzLCBfb3B0aW9ucykgPT4ge1xuXG4gIGNvbnN0IG9wdGlvbnMgPSBfb3B0aW9ucyB8fCB7fTtcblxuICByZXR1cm4gZnVuY3Rpb24oQ29tcG9uZW50KSB7XG5cbiAgICBjb25zdCBtYXBTdGF0ZVRvUHJvcHMgPSBfbWFwU3RhdGVUb1Byb3BzIHx8IENvbXBvbmVudC5wcm90b3R5cGUubWFwU3RhdGVUb1Byb3BzIHx8IGRlZmF1bHRNYXBTdGF0ZVRvUHJvcHM7XG4gICAgY29uc3QgbWFwRGlzcGF0Y2hUb1Byb3BzID0gX21hcERpc3BhdGNoVG9Qcm9wcyB8fCBDb21wb25lbnQucHJvdG90eXBlLm1hcERpc3BhdGNoVG9Qcm9wcyB8fCBkZWZhdWx0TWFwRGlzcGF0Y2hUb1Byb3BzO1xuICAgIGNvbnN0IG1lcmdlUHJvcHMgPSBfbWVyZ2VQcm9wcyB8fCBDb21wb25lbnQucHJvdG90eXBlLm1lcmdlUHJvcHMgfHwgZGVmYXVsdE1lcmdlUHJvcHM7XG4gICAgY29uc3Qgc3RvcmUgPSBvcHRpb25zLnN0b3JlIHx8IENvbXBvbmVudC5wcm90b3R5cGUuc3RvcmU7XG4gICAgY29uc3QgY29tcG9uZW50SW5pdGlhbGl6ZSA9IENvbXBvbmVudC5wcm90b3R5cGUuaW5pdGlhbGl6ZTtcbiAgICBjb25zdCBjb21wb25lbnRvblJlbmRlciA9IENvbXBvbmVudC5wcm90b3R5cGUub25SZW5kZXI7XG4gICAgY29uc3QgY29tcG9uZW50T25EZXN0cm95ID0gQ29tcG9uZW50LnByb3RvdHlwZS5vbkRlc3Ryb3k7XG5cbiAgICBjb25zdCBjb25uZWN0TWl4aW4gPSBfLmRlZmF1bHRzKHt9LCB7XG5cbiAgICAgIGluaXRpYWxpemUoX2luaXRPcHRpb25zKSB7XG5cbiAgICAgICAgY29uc3QgaW5pdE9wdGlvbnMgPSBfaW5pdE9wdGlvbnMgfHwge307XG5cbiAgICAgICAgbWl4aW4uaW5pdGlhbGl6ZS5jYWxsKHRoaXMsIHtcbiAgICAgICAgICBtYXBTdGF0ZVRvUHJvcHMsXG4gICAgICAgICAgbWFwRGlzcGF0Y2hUb1Byb3BzLFxuICAgICAgICAgIG1lcmdlUHJvcHMsXG4gICAgICAgICAgc3RvcmUsXG4gICAgICAgICAgcHJvcHM6IGluaXRPcHRpb25zLnByb3BzXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChjb21wb25lbnRJbml0aWFsaXplKSB7XG4gICAgICAgICAgY29tcG9uZW50SW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBvblJlbmRlcigpIHtcblxuICAgICAgICBtaXhpbi5vblJlbmRlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgICAgIGlmIChjb21wb25lbnRvblJlbmRlcikge1xuICAgICAgICAgIGNvbXBvbmVudG9uUmVuZGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgb25EZXN0cm95KCkge1xuXG4gICAgICAgIG1peGluLm9uRGVzdHJveS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgICAgIGlmIChjb21wb25lbnRPbkRlc3Ryb3kpIHtcbiAgICAgICAgICBjb21wb25lbnRPbkRlc3Ryb3kuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIG1peGluKTtcblxuICAgIHJldHVybiBDb21wb25lbnQuZXh0ZW5kKGNvbm5lY3RNaXhpbilcbiAgfVxufVxuIl0sIm5hbWVzIjpbImRpc3BhdGNoIiwic3RhdGVQcm9wcyIsImRpc3BhdGNoUHJvcHMiLCJwYXJlbnRQcm9wcyIsIl8iLCJleHRlbmQiLCJrZXkiLCJ2YWwiLCJvcHRpb25zIiwic3RhdGUiLCJ1bnNldCIsInNpbGVudCIsImNoYW5nZXMiLCJjaGFuZ2luZyIsIl9jaGFuZ2luZyIsIl9wcmV2aW91c1N0YXRlIiwiY2xvbmUiLCJjaGFuZ2VkIiwiY3VycmVudCIsInByZXYiLCJlYWNoIiwiX3ZhbCIsIl9rZXkiLCJpc0VxdWFsIiwicHVzaCIsImxlbmd0aCIsIl9wZW5kaW5nIiwiaSIsInRyaWdnZXIiLCJhdHRyIiwiX29wdGlvbnMiLCJtYXBTdGF0ZSIsIm1hcFN0YXRlVG9Qcm9wcyIsImRlZmF1bHRNYXBTdGF0ZVRvUHJvcHMiLCJtYXBEaXNwYXRjaCIsIm1hcERpc3BhdGNoVG9Qcm9wcyIsImRlZmF1bHRNYXBEaXNwYXRjaFRvUHJvcHMiLCJtZXJnZVByb3BzIiwiZGVmYXVsdE1lcmdlUHJvcHMiLCJwcm9wcyIsInN0b3JlIiwid2luZG93Iiwic3RvcmVTdGF0ZSIsImdldFN0YXRlIiwiZGVmYXVsdHMiLCJiaW5kU3RhdGVFdmVudHMiLCJjbGVhckNhY2hlIiwiTWFyaW9uZXR0ZSIsIlZpZXciLCJCZWhhdmlvciIsInRyeVN1YnNjcmliZSIsImJpbmQiLCJzdGF0ZUV2ZW50cyIsImJpbmRFdmVudHMiLCJiaW5kRW50aXR5RXZlbnRzIiwidW5iaW5kIiwidW5iaW5kRXZlbnRzIiwidW5iaW5kRW50aXR5RXZlbnRzIiwiZmluYWxNYXBTdGF0ZVRvUHJvcHMiLCJjb25maWd1cmVGaW5hbE1hcFN0YXRlIiwiZG9TdGF0ZVByb3BzRGVwZW5kT25Pd25Qcm9wcyIsIm1hcHBlZFN0YXRlIiwiaXNGYWN0b3J5IiwiaXNGdW5jdGlvbiIsImNvbXB1dGVTdGF0ZVByb3BzIiwibmV4dFN0YXRlUHJvcHMiLCJmaW5hbE1hcERpc3BhdGNoVG9Qcm9wcyIsImNvbmZpZ3VyZUZpbmFsTWFwRGlzcGF0Y2giLCJkb0Rpc3BhdGNoUHJvcHNEZXBlbmRPbk93blByb3BzIiwibWFwcGVkRGlzcGF0Y2giLCJjb21wdXRlRGlzcGF0Y2hQcm9wcyIsIm5leHREaXNwYXRjaFByb3BzIiwidW5zdWJzY3JpYmUiLCJpc1N1YnNjcmliZWQiLCJzdWJzY3JpYmUiLCJoYW5kbGVDaGFuZ2UiLCJoYW5kbGVEaXNwYXRjaFByb3BzIiwidHJ5VW5zdWJzY3JpYmUiLCJ1bmJpbmRTdGF0ZUV2ZW50cyIsImhhdmVJbml0aWFsU3RhdGVQcm9wc0JlZW5EZXRlcm1pbmVkIiwiaGF2ZUluaXRpYWxEaXNwYXRjaFByb3BzQmVlbkRldGVybWluZWQiLCJ1cGRhdGVEaXNwYXRjaFByb3BzSWZOZWVkZWQiLCJwcmV2U3RvcmVTdGF0ZSIsImhhdmVTdGF0ZVByb3BzQ2hhbmdlZCIsInVwZGF0ZVN0YXRlUHJvcHNJZk5lZWRlZCIsIm1lcmdlZFByb3BzIiwiY29tcG9uZW50RGlkUmVjZWl2ZVByb3BzIiwic2V0U3RhdGUiLCJfbWFwU3RhdGVUb1Byb3BzIiwiX21hcERpc3BhdGNoVG9Qcm9wcyIsIl9tZXJnZVByb3BzIiwiQ29tcG9uZW50IiwicHJvdG90eXBlIiwiY29tcG9uZW50SW5pdGlhbGl6ZSIsImluaXRpYWxpemUiLCJjb21wb25lbnRvblJlbmRlciIsIm9uUmVuZGVyIiwiY29tcG9uZW50T25EZXN0cm95Iiwib25EZXN0cm95IiwiY29ubmVjdE1peGluIiwiX2luaXRPcHRpb25zIiwiaW5pdE9wdGlvbnMiLCJjYWxsIiwiYXBwbHkiLCJhcmd1bWVudHMiLCJtaXhpbiJdLCJtYXBwaW5n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