import _ from 'underscore';
import defaultMapStateToProps from './mapStateToProps'
import defaultMapDispatchToProps from './mapDispatchToProps'
import defaultMergeProps from './mergeProps'
import mixin from './mixin'

export default (_mapStateToProps, _mapDispatchToProps, _mergeProps, _options) => {

  const options = _options || {};

  return function(Component) {

    const mapStateToProps = _mapStateToProps || Component.prototype.mapStateToProps || defaultMapStateToProps;
    const mapDispatchToProps = _mapDispatchToProps || Component.prototype.mapDispatchToProps || defaultMapDispatchToProps;
    const mergeProps = _mergeProps || Component.prototype.mergeProps || defaultMergeProps;
    const store = options.store || Component.prototype.store;
    const componentInitialize = Component.prototype.initialize;
    const componentonRender = Component.prototype.onRender;
    const componentOnDestroy = Component.prototype.onDestroy;

    const connectMixin = _.defaults({}, {

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

        if (componentonRender) {
          componentonRender.apply(this, arguments)
        }
      },

      onDestroy() {

        mixin.onDestroy.apply(this, arguments);

        if (componentOnDestroy) {
          componentOnDestroy.apply(this, arguments);
        }
      }
    }, mixin);

    return Component.extend(connectMixin)
  }
}
