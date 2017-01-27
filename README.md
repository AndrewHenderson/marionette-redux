Marionette Redux
=========================

[Marionette](https://github.com/marionettejs/backbone.marionette) and [Backbone](https://github.com/jashkenas/backbone) bindings for [Redux](https://github.com/reactjs/redux).

It's like [React Redux](https://github.com/reactjs/react-redux), but for Marionette and Backbone.

Marionette Redux allows you to `connect` any Marionette or Backbone "component" to a Redux store.

## Installation

```
npm i -S marionette-redux
```

__If you are using this in a UMD environment, this library expects Marionette to be defined as `marionette`.__

```
var Marionette = require('marionette');

// or

define(['marionette'], function(Marionette) { … });
```

__If you are using another alias for Marionette, this library will likely throw an error, since Marionette will be `undefined`. You may have run into this issue if you were using >v2.0.__

## Usage

### `connect`

Below is an example of a `Marionette.View` that has been subscribed to a Redux store. The following code could also be applied to a `Marionette.Behavior`.

```js
var ConnectedView = MarionetteRedux.connect()(Marionette.View.extend({
  
  store: store,
  
  mapStateToProps: function(state) {
    return {
      isActive: state.isActive
    }
  },
  
  componentWillUpdate: function() {
    this.$el.toggleClass('active', this.props.isActive);
  }
}));
```

__In this example, `store` is a property on the component, but `connect` will also look to `window.store` as a last resort. `window.store` can thus act similarly to React Redux's "[`Provider`](https://github.com/reactjs/react-redux/blob/master/docs/api.md#provider-store)".__

### `mixin`

While `connect` is the recommended approach, Marionette Redux can also be used as a mixin.

```js
Marionette.View.extend(MarionetteRedux.mixin);
```

## Mappings

Mappings work the same as in [React Redux](https://github.com/reactjs/react-redux). A change to the Redux store will result in this callback being executed on any "connected" components.

### `mapStateToProps`

`mapStateToProps` can be a property on the component itself.

```js
var ConnectedView = MarionetteRedux.connect()(Marionette.View.extend({
  mapStateToProps: function(state) {
    return {
      isActive: state.isActive
    }
  }
}));
```

Or it can be provided to `connect` as the first argument.

```js
function mapStateToProps(state) {
  return {
    isActive: state.isActive
  }
}
var ConnectedView = MarionetteRedux.connect(mapStateToProps)(Marionette.View.extend({…}));
```

### `mapDispatchToProps`

`mapDispatchToProps` can also be a property on the component.

```js
var ConnectedView = MarionetteRedux.connect()(Marionette.View.extend({
  mapDispatchToProps: function(dispatch) {
    return {
      dispatchMyEvent: function() {
        dispatch({
          type: 'MY_EVENT'
        });
      }
    }
  },
  events: {
    click: 'handleClick'
  },
  handleClick: function() {
    this.props.dispatchMyEvent();
  }
}));
```

Or it can provided to `connect` as the second argument.

```js
var ConnectedView = MarionetteRedux.connect(null, mapDispatchToProps)(Marionette.View.extend({…}));
```

## Lifecycle

###`componentWillReceiveProps`

This function is similar to React's `componentWillReceiveProps`. It provides an opportunity to execute any side effect functions before execution of `componentWillUpdate` in the case of a display component (`Marionette.View` or `Marionette.Behavior`).

If the component is not a display component, `componentWillReceiveProps` will still execute, however `componentWillUpdate` will not be executed after.

### `componentWillUpdate`

This library ecourages the use of `componentWillUpdate` to ensure predictability of DOM state – one of the great things about React.

As demonstrated above, `componentWillUpdate` can be used to execute code that you want to run when a component is first rendered and after any subsequent changes to a component's `props` or `state`.

## State

If you prefer more granular control over store updates, we've provided state to components as well.

`setState`, `getState`, `state`, and `getInitialState` are all available for getting and setting state.

State works exactly the same as Marionette's `modelEvents` listeners, using the `stateEvents` object to define listeners:

```js
var ConnectedView = MarionetteRedux.connect()(Marionette.View.extend({

  store: store,

  getInitialState: function() {
    return: {
      isActive: false
    }
  },
  stateEvents: {
    'change:isActive': 'onIsActiveChange'
  },
  onIsActiveChange: function(view, isActive) {
    this.$el.toggleClass('active', isActive);
  },
  mapStateToProps: function(state) {
    return {
      isActive: state.active === this.model.id
    }
  },
  componentWillReceiveProps: function(update) {
    this.setState({
      isActive: update.isActive
    });
  },
}));
```

As with changes to `props`, changes to a display component's `state` will execute `componentWillUpdate`.

## Backbone

You also have the option to `connect` a `Backbone.Model` or `Backbone.Collection`.

```js
function mapStateToProps(state) {
  return {
    currency: state.currency
  }
}
var Model = Backbone.Model.extend({

  store: store,
  
  componentWillReceiveProps: function(update) {
    this.set({
      currency: update.currency
    })
  }
});
var ConnectedModel = MarionetteRedux.connect(mapStateToProps)(Model);
```

## License

MIT
