import { isObject, isFunction } from 'underscore'
import { View, Behavior } from 'marionette'

export default function isDisplayComponent(Component) {
  if (isFunction(Component)) {
    return Component.prototype instanceof View || Component.prototype instanceof Behavior
  }
  if (isObject(Component)) {
    return Component instanceof View || Component instanceof Behavior
  }
  return false
}
