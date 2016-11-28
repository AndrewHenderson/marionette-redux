import _ from 'underscore';
import defaultMapStateToProps from './mapStateToProps'
import defaultMapDispatchToProps from './mapDispatchToProps'
import mixin from './mixin'

export default (_mapStateToProps, _mapDispatchToProps, _options) => {

  const options = _options || {};

  return function(Component) {

    const mapStateToProps = _mapStateToProps || Component.prototype.mapStateToProps || defaultMapStateToProps;
    const mapDispatchToProps = _mapDispatchToProps || Component.prototype.mapDispatchToProps || defaultMapDispatchToProps;
    const store = options.store || Component.prototype.store
    const componentInitialize = Component.prototype.initialize;
    const componentOnAttach = Component.prototype.onAttach;
    const componentOnDestroy = Component.prototype.onDestroy;

    const connectMixin = _.defaults({}, {

      initialize(initOptions) {

        mixin.initialize.call(this, {
          mapStateToProps: mapStateToProps,
          mapDispatchToProps: mapDispatchToProps,
          store: store
        });

        if (componentInitialize) {
          componentInitialize.call(this, initOptions)
        }
      },

      onAttach() {

        mixin.onAttach.call(this);

        if (componentOnAttach) {
          componentOnAttach.call(this)
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
