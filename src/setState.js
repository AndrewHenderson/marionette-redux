import _ from 'underscore';

export default function(key, val, options) {

  if (key == null) {
    return this;
  }

  // Handle both `"key", value` and `{key: value}` -style arguments.
  let state;
  if (typeof key === 'object') {
    state = key;
    options = val;
  } else {
    (state = {})[key] = val;
  }

  options || (options = {});

  // Extract state and options.
  const unset      = options.unset;
  const silent     = options.silent;
  const changes    = [];
  const changing   = this._changing;
  this._changing = true;

  if (!changing) {
    this._previousState = _.clone(this.state);
    this.changed = {};
  }

  const current = this.state;
  const changed = this.changed;
  const prev    = this._previousState;

  // For each `set` state, update or delete the current value.
  _.each(state, function(_val, _key) {
    if (!_.isEqual(current[_key], _val)) {
      changes.push(_key);
    }
    if (!_.isEqual(prev[_key], _val)) {
      changed[_key] = _val;
    } else {
      delete changed[_key];
    }
    unset ? delete current[_key] : current[_key] = _val;
  });

  // Trigger all relevant state changes.
  if (!silent) {
    if (changes.length) {
      this._pending = options;
    }
    for (let i = 0; i < changes.length; i++) {
      this.trigger('change:' + changes[i], this, current[changes[i]], options);
    }
  }

  // You might be wondering why there's a `while` loop here. Changes can
  // be recursively nested within `"change"` events.
  if (changing) {
    return this;
  }
  if (!silent) {
    while (this._pending) {
      options = this._pending;
      this._pending = false;
      this.trigger('change', this, options);
    }
  }
  this._pending = false;
  this._changing = false;
  return this
}
