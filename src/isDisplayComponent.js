import _ from 'underscore';

export default function isDisplayComponent(Component) {
  if (_.isFunction(Component)) {
    return Component.prototype.hasOwnProperty('getUI')
  }
  if (_.isObject(Component)) {
    return Object.getPrototypeOf(Component).hasOwnProperty('getUI')
  }
  return false
}
