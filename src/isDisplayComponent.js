import Marionette from 'marionette'

export default function(Component) {
  if (typeof Component === 'object') {
    return Component instanceof Marionette.View || Component instanceof Marionette.Behavior
  }
  if (typeof Component === 'function') {
    return Component.prototype instanceof Marionette.View || Component.prototype instanceof Marionette.Behavior
  }
  return false
}
