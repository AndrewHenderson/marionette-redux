import _ from 'underscore';
export default function mergeProps(stateProps, dispatchProps, parentProps) {
  return _.extend({}, parentProps, stateProps, dispatchProps)
}
