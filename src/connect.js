import _ from 'underscore';

import defaultMapStateToProps from './mapStateToProps'
import defaultMapDispatchToProps from './mapDispatchToProps'
import defaultMergeProps from './mergeProps'
import mixin from './mixin'
import isDisplayComponent from './isDisplayComponent';

export default function connect(_mapStateToProps, _mapDispatchToProps, _mergeProps, _options) {

  const options = _options || {};

  return function(Component) {

    const mapStateToProps = _mapStateToProps || Component.prototype.mapStateToProps || defaultMapStateToProps;
    const mapDispatchToProps = _mapDispatchToProps || Component.prototype.mapDispatchToProps || defaultMapDispatchToProps;
    const mergeProps = _mergeProps || Component.prototype.mergeProps || defaultMergeProps;
    const store = options.store || Component.prototype.store;
    const componentInitialize = Component.prototype.initialize;
    const componentOnRender = Component.prototype.onRender;
    const componentOnDestroy = Component.prototype.onDestroy;
    const getInitialState = Component.prototype.getInitialState || function() {
      return {}
    };

    let connectMixin = _.defaults({}, {

      getInitialState,

      initialize(_initOptions) {

        const initOptions = _initOptions || {};

        mixin.initialize.call(this, {
          mapStateToProps,
          mapDispatchToProps,
          mergeProps,
          store,
          props: initOptions.props
        });

        if (componentInitialize) {
          componentInitialize.apply(this, arguments);
        }
      },

      onRender() {

        mixin.onRender.apply(this, arguments);

        if (componentOnRender) {
          componentOnRender.apply(this, arguments)
        }
      },

      onDestroy() {

        mixin.onDestroy.apply(this, arguments);

        if (componentOnDestroy) {
          componentOnDestroy.apply(this, arguments);
        }
      }
    }, mixin);

    if (!isDisplayComponent(Component)) {
      connectMixin = _.omit(connectMixin, 'onRender')
    }

    return Component.extend(connectMixin)
  }
}
