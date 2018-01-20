import _ from 'underscore';
import Marionette from 'marionette'

export default function isDisplayComponent(Component) {
  if (_.isFunction(Component)) {
    return Component.prototype instanceof Marionette.View || Component.prototype instanceof Marionette.CollectionView || Component.prototype instanceof Marionette.Behavior
  }
  if (_.isObject(Component)) {
    return Component instanceof Marionette.View || Component instanceof Marionette.CollectionView || Component instanceof Marionette.Behavior
  }
  return false
}