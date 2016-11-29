import _ from 'underscore';
import defaultMapStateToProps from './mapStateToProps'
import defaultMapDispatchToProps from './mapDispatchToProps'
import mixin from './mixin'

export default (_mapStateToProps, _mapDispatchToProps, _options) => {

  const options = _options || {};

  return function(Component) {

    const mapStateToProps = _mapStateToProps || Component.prototype.mapStateToProps || defaultMapStateToProps;
    const mapDispatchToProps = _mapDispatchToProps || Component.prototype.mapDispatchToProps || defaultMapDispatchToProps;
    const store = options.store || Component.prototype.store;
    const componentInitialize = Component.prototype.initialize;
    const componentOnDestroy = Component.prototype.onDestroy;

    const connectMixin = _.defaults({}, {

      initialize(_initOptions) {

        const initOptions = _initOptions || {};

        mixin.initialize.call(this, {
          mapStateToProps,
          mapDispatchToProps,
          store,
          props: initOptions.props
        });

        if (componentInitialize) {
          componentInitialize.call(this, initOptions)
        }
      },

      onDestroy() {

        mixin.onDestroy.call(this);

        if (componentOnDestroy) {
          componentOnDestroy.call(this)
        }
      }
    }, mixin);

    return Component.extend(connectMixin)
  }
}
