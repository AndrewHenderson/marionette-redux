import _ from 'underscore';

function bindFromStrings(target, entity, evt, methods, actionName) {
  const methodNames = methods.split(/\s+/);

  _.each(methodNames, function(methodName) {
    const method = target[methodName];
    if (!method) {
      throw new Error(`Method "${methodName}" was configured as an event handler, but does not exist.`);
    }

    target[actionName](entity, evt, method);
  });
}

// generic looping function
function iterateEvents(target, entity, bindings, actionName) {
  // type-check bindings
  if (!_.isObject(bindings)) {
    throw new Error('Bindings must be an object.');
  }

  // iterate the bindings and bind/unbind them
  _.each(bindings, function(method, evt) {

    // allow for a list of method names as a string
    if (_.isString(method)) {
      bindFromStrings(target, entity, evt, method, actionName);
      return;
    }

    target[actionName](entity, evt, method);
  });
}

export function bindEvents(entity, bindings) {
  if (!entity || !bindings) { return this; }

  iterateEvents(this, entity, bindings, 'listenTo');
  return this;
}

export function unbindEvents(entity, bindings) {
  if (!entity) { return this; }

  if (!bindings) {
    this.stopListening(entity);
    return this;
  }

  iterateEvents(this, entity, bindings, 'stopListening');
  return this;
}
