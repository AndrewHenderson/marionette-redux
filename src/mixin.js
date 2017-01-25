import {
  extend,
  defaults,
  clone,
  each,
  isEqual,
  isFunction,
  isObject
} from 'underscore';
import {
  bindEvents,
  bindEntityEvents,
  unbindEvents,
  unbindEntityEvents
} from 'marionette';
import defaultMapStateToProps from './mapStateToProps';
import defaultMapDispatchToProps from './mapDispatchToProps';
import defaultMergeProps from './mergeProps';
import isDisplayComponent from './isDisplayComponent';

const mixin = {

  initialize(_options) {

    const options = _options || {};

    this.mapState = options.mapStateToProps || this.mapStateToProps || defaultMapStateToProps;
    this.mapDispatch = options.mapDispatchToProps || this.mapDispatchToProps || defaultMapDispatchToProps;
    this.mergeProps = options.mergeProps || this.mergeProps || defaultMergeProps;
    this.props = this.props || {};

    if (options.props) {
      extend(this.props, options.props)
    }

    this.store = options.store || this.store;

    if (!this.store && window && window.store) {
      this.store = window.store
    }

    const storeState = this.store.getState();
    this.state = defaults({
      storeState: storeState
    }, this.getInitialState());

    this.bindStateEvents();
    this.clearCache();

    if (!isDisplayComponent(this)) {
      this.trySubscribe()
    }
  },

  getInitialState() {
    return {}
  },

  setState(key, val, options) {

    if (key == null) {
      return this;
    }

    // Handle both `"key", value` and `{key: value}` -style arguments.
    let state;
    if (isObject(key)) {
      state = key;
      options = val;
    } else {
      (state = {})[key] = val;
    }

    options || (options = {});

    // Extract state and options.
    const unset      = options.unset;
    const silent     = options.silent;
    const changes    = [];
    const changing   = this._changing;
    this._changing = true;

    if (!changing) {
      this._previousState = clone(this.state);
      this.changed = {};
    }

    const current = this.state;
    const changed = this.changed;
    const prev    = this._previousState;

    // For each `set` state, update or delete the current value.
    each(state, function(_val, _key) {
      if (!isEqual(current[_key], _val)) {
        changes.push(_key);
      }
      if (!isEqual(prev[_key], _val)) {
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
      for (let i = 0; i < changes.length; i++) {
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
    return this
  },

  getState(attr) {
    return this.state[attr]
  },

  bindStateEvents() {
    const bind = bindEvents || bindEntityEvents;
    if (this.stateEvents) {
      bind(this, this, this.stateEvents)
    }
  },

  unbindStateEvents() {
    const unbind = unbindEvents || unbindEntityEvents;
    if (this.stateEvents) {
      unbind(this, this, this.stateEvents)
    }
  },

  computeStateProps(store, props) {
    if (!this.finalMapStateToProps) {
      return this.configureFinalMapState(store, props)
    }

    const state = store.getState();
    const stateProps = this.doStatePropsDependOnOwnProps ?
      this.finalMapStateToProps(state, props) :
      this.finalMapStateToProps(state);

    return stateProps
  },

  configureFinalMapState(store, props) {
    const mappedState = this.mapState(store.getState(), props);
    const isFactory = isFunction(mappedState);

    this.finalMapStateToProps = isFactory ? mappedState : this.mapState;
    this.doStatePropsDependOnOwnProps = this.finalMapStateToProps.length !== 1;

    if (isFactory) {
      return this.computeStateProps(store, props)
    }

    return mappedState
  },

  updateStatePropsIfNeeded() {
    const nextStateProps = this.computeStateProps(this.store, this.props);
    if (this.stateProps && isEqual(nextStateProps, this.stateProps)) {
      return false
    }

    this.stateProps = nextStateProps;

    return true
  },

  computeDispatchProps(store, props) {
    if (!this.finalMapDispatchToProps) {
      return this.configureFinalMapDispatch(store, props)
    }

    const dispatch = store.dispatch;
    const dispatchProps = this.doDispatchPropsDependOnOwnProps ?
      this.finalMapDispatchToProps(dispatch, props) :
      this.finalMapDispatchToProps(dispatch);

    return dispatchProps
  },

  configureFinalMapDispatch(store, props) {
    const mappedDispatch = this.mapDispatch(store.dispatch, props);
    const isFactory = isFunction(mappedDispatch);

    this.finalMapDispatchToProps = isFactory ? mappedDispatch : this.mapDispatch;
    this.doDispatchPropsDependOnOwnProps = this.finalMapDispatchToProps.length !== 1;

    if (isFactory) {
      return this.computeDispatchProps(store, props)
    }

    return mappedDispatch
  },

  updateDispatchPropsIfNeeded() {
    const nextDispatchProps = this.computeDispatchProps(this.store, this.props);
    if (this.dispatchProps && isEqual(nextDispatchProps, this.dispatchProps)) {
      return false
    }

    this.dispatchProps = nextDispatchProps;

    return true
  },

  isSubscribed() {
    return isFunction(this.unsubscribe)
  },

  trySubscribe() {
    if (!this.isSubscribed()) {
      this.unsubscribe = this.store.subscribe(this.handleChange.bind(this));
      this.handleDispatchProps();
      this.handleChange()
    }
  },

  tryUnsubscribe() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null
    }
  },

  onRender() {
    this.trySubscribe()
  },

  onDestroy() {
    this.tryUnsubscribe();
    this.unbindStateEvents();
    this.clearCache()
  },

  clearCache() {
    this.dispatchProps = null;
    this.stateProps = null;
    this.finalMapDispatchToProps = null;
    this.finalMapStateToProps = null;
    this.haveInitialStatePropsBeenDetermined = false;
    this.haveInitialDispatchPropsBeenDetermined = false
  },

  handleDispatchProps() {
    if (!this.haveInitialDispatchPropsBeenDetermined) {
      this.updateDispatchPropsIfNeeded();
      this.haveInitialDispatchPropsBeenDetermined = true
    }
  },

  handleChange() {
    if (!this.unsubscribe) {
      return
    }

    const storeState = this.store.getState();
    const prevStoreState = this.getState('storeState');
    if (this.haveInitialStatePropsBeenDetermined && isEqual(prevStoreState, storeState)) {
      return
    }

    const haveStatePropsChanged = this.updateStatePropsIfNeeded();
    this.haveInitialStatePropsBeenDetermined = true;

    if (haveStatePropsChanged) {

      const mergedProps = this.mergeProps(this.stateProps, this.dispatchProps, this.props);
      this.props = mergedProps;

      isFunction(this.componentWillReceiveProps) && this.componentWillReceiveProps(mergedProps);

      if (isDisplayComponent(this) && this.triggerDomRefresh !== false) {
        this.triggerMethod('dom:refresh');
      }
    }

    this.setState({
      storeState
    })
  }
};

export default mixin;
