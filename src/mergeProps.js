import { extend } from 'underscore';
export default function mergeProps(stateProps, dispatchProps, parentProps) {
  return extend({}, parentProps, stateProps, dispatchProps)
}
