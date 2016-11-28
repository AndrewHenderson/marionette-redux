import _ from 'underscore';
import defaultMapStateToProps from './mapStateToProps'
import defaultMapDispatchToProps from './mapDispatchToProps'
import defaultMergeProps from './mergeProps'

export default {

  initialize(_options) {

    const options = _options || {};

    this.mapState = options.mapStateToProps || this.mapStateToProps || defaultMapStateToProps;
    this.mapDispatch = options.mapDispatchToProps || this.mapDispatchToProps || defaultMapDispatchToProps;
    this.props = this.props || {};
    this.store = options.store || this.store;
    const storeState = this.store.getState();
    this.state = _.defaults({
      storeState: storeState
    }, this.state);
    this.clearCache()
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
    const isFactory = _.isFunction(mappedState);

    this.finalMapStateToProps = isFactory ? mappedState : this.mapState;
    this.doStatePropsDependOnOwnProps = this.finalMapStateToProps.length !== 1;

    if (isFactory) {
      return this.computeStateProps(store, props)
    }

    return mappedState
  },

  updateStatePropsIfNeeded() {
    const nextStateProps = this.computeStateProps(this.store, this.props);
    if (this.stateProps && _.isEqual(nextStateProps, this.stateProps)) {
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
    const isFactory = _.isFunction(mappedDispatch);

    this.finalMapDispatchToProps = isFactory ? mappedDispatch : this.mapDispatch;
    this.doDispatchPropsDependOnOwnProps = this.finalMapDispatchToProps.length !== 1;

    if (isFactory) {
      return this.computeDispatchProps(store, props)
    }

    return mappedDispatch
  },

  updateDispatchPropsIfNeeded() {
    const nextDispatchProps = this.computeDispatchProps(this.store, this.props);
    if (this.dispatchProps && _.isEqual(nextDispatchProps, this.dispatchProps)) {
      return false
    }

    this.dispatchProps = nextDispatchProps;

    return true
  },

  isSubscribed() {
    return _.isFunction(this.unsubscribe)
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

  onAttach() {
    this.trySubscribe();
  },

  onDestroy() {
    this.tryUnsubscribe();
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
    if (this.haveInitialStatePropsBeenDetermined && _.isEqual(prevStoreState, storeState)) {
      return
    }

    const haveStatePropsChanged = this.updateStatePropsIfNeeded();
    this.haveInitialStatePropsBeenDetermined = true;

    if (haveStatePropsChanged) {

      const mergedProps = defaultMergeProps(this.stateProps, this.dispatchProps, this.props);
      this.props = mergedProps;

      _.isFunction(this.componentDidReceiveProps) && this.componentDidReceiveProps(mergedProps)
    }

    this.state.storeState = storeState
  }
};
