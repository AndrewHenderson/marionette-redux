Marionette Redux
=========================

[Marionette](https://github.com/marionettejs/backbone.marionette) and [Backbone](https://github.com/jashkenas/backbone) bindings for [Redux](https://github.com/reactjs/redux).

## How Does It Work?

It's like [React Redux](https://github.com/reactjs/react-redux), but for Marionette and Backbone.

Marionette Redux allows you to `connect` any Marionette or Backbone "component" to a Redux store.

## Installation

```
npm install --save marionette-redux
```

## API

### `connect`

Below is an example of a `Marionette.View` that has been subscribed to a Redux store. The following code just as easily be applied to `Marionette.Behavior`.

```js
var ConnectedView = MarionetteRedux.connect()(Marionette.View.extend({
  store: store,
  getInitialState: function() {
    return: {
      isActive: false
    }
  },
  stateEvents: {
    'change:isActive': 'handleIsActiveChange'
  },
  mapStateToProps: function(state) {
    return {
      isActive: state.isActive
    }
  },
  componentDidReceiveProps: function(update) {
    this.setState({
      isActive: update.isActive
    });
  },
  handleIsActiveChange: function(view, isActive) {
    this.$el.toggleClass('active', isActive);
  }
}));
```
__Note:__ In this example, `store` is a property on the component, but `connect` will also look to `window.store` as a last resort. `window.store` can thus act similarly to React Redux's "[`Provider`](https://github.com/reactjs/react-redux/blob/master/docs/api.md#provider-store)".

## `componentDidReceiveProps`

A component's `componentDidReceiveProps` will be executed when the state of the Redux store has changed that particular component has provided a `mapStateToProps` function to `connect`.

## `mapStateToProps` and `mapDispatchToProps`

These work exactly as they do in [React Redux](https://github.com/reactjs/react-redux).

`mapStateToProps` can be a property on the component itself (as seen in the previous example) or it can be passed to `connect` as the first argument:

```js
function mapStateToProps(state) {
  return {
    isActive: state.isActive
  }
}
var ConnectedView = MarionetteRedux.connect(mapStateToProps)(Marionette.View.extend({…}));
```

`mapDispatchToProps` can also be on the component:

```js
var ConnectedView = MarionetteRedux.connect()(Marionette.View.extend({
  events: {
    'click': 'handleClick'
  },
  mapDispatchToProps: function(dispatch) {
    return {
      dispatchMyEvent: function() {
        dispatch({
          type: 'MY_EVENT'
        });
      }
    }
  },
  handleClick: function() {
    this.props.dispatchMyEvent();
  }
}));
```

Or as the second argument provided to `connect`.

```js
var ConnectedView = MarionetteRedux.connect(null, mapDispatchToProps)(Marionette.View.extend({…}));
```

### `Backbone.Model` and `Backbone.Collection`

You also have the option to `connect` `Backbone.Model`s and `Backbone.Collection`s.

```js
var mapStateToProps = function(state) {
  return {
    currency: state.currency
  }
}
var Model = Backbone.Model.extend({
  store: store,
  componentDidReceiveProps: function(update) {
    this.set({
      currency: update.currency
    })
  }
});
var ConnectedModel = MarionetteRedux.connect(mapStateToProps)(Model);
```

### `mixin`

While `connect` is the recommended approach, if you'd rather employ a mixin, you can use the following:

```js
Marionette.View.extend(MarionetteRedux.mixin);
```

### `setState` and `getState`

We've also added the `setState` and `getState` for convenient view layer state event changes. This works exactly the same as Marionette's `modelEvents` listeners, using the `stateEvents` object to define listeners:

```js
var ConnectedView = MarionetteRedux.connect()(Marionette.View.extend({
  getInitialState: function() {
    return {
      foo: null
    }
  }
  stateEvents: {
    'change:foo': 'handleFooChange'
  },
  handelFooChange: function(view, foo) {
    console.log("Foo changed to " + foo + "!");
  }
}));
var connectedView = new ConnectedView();
connectedView.setState({ foo: 'bar' }); // or connectedView.setState('foo', 'bar');
connectedView.getState('foo'); // "bar"
```

## License

MIT
