import _ from 'underscore';
export default (stateProps, dispatchProps, parentProps) => (
  _.extend({}, parentProps, stateProps, dispatchProps)
)
