Marionette Redux
=========================

[Marionette](https://github.com/marionettejs/backbone.marionette) bindings for [Redux](https://github.com/reactjs/redux) with support for [Backbone](https://github.com/jashkenas/backbone).

Performant and flexible.

## How Does It Work?

It's like [React-Redux](https://github.com/reactjs/react-redux), but for Marionette and Backbone.

Marionette Redux allows you to `connect` any Marionette or Backbone "component" to a Redux store.

There is an excellent video on how React Redux works in [this readthesource episode](https://www.youtube.com/watch?v=VJ38wSFbM3A), which I recommend.

You can also check out some demos below or the [examples](https://github.com/AndrewHenderson/marionette-redux/tree/master/examples). Enjoy!

## How can I use this project?

My personal goal is to allow the codebase I work on to migrate the business logic out of Backbone Models and Collections and into Redux, then rewrite the existing view layer in React at a later point.

In the interim, new components can be written in React with the ability to communicate with a shared data event API.

## Installation

```
npm install --save marionette-redux
```
If you don’t yet use [npm](http://npmjs.com/) or a modern module bundler, and would rather prefer a single-file [UMD](https://github.com/umdjs/umd) build that makes `MarionetteRedux` available as a global object.

## Documentation

- [API](docs/api.md#api)
  - [`connect([mapStateToProps], [mapDispatchToProps], [mergeProps], [options])`](docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options)
  - [`mixin`](docs/api.md#mixin)
- [Troubleshooting](docs/troubleshooting.md#troubleshooting)

### `connect`
Below is an example of a `Marionette.View` that has been subscribed to a Redux store, however, the following could just as easily be a `Marionette.Behavior`.

__Note: In the following example, `store` is placed on the View itself, but `connect` will also look at `window.store` as a last resort. `window.store` can thus act similarly to React Redux's "[`Provider`](https://github.com/reactjs/react-redux/blob/master/docs/api.md#provider-store)".__
```js
var mapStateToProps = function(state) {
  return {
    isActive: state.isActive
  }
}
var ConnectedView = MarionetteRedux.connect(mapStateToProps)(Marionette.View.extend({
  store: store,
  events: {
    click: 'handleClick'
  },
  stateEvents: {
    'change:isActive': 'handleIsActiveChange'
  },
  getInitialState: function() {
    return: {
      isActive: false
    }
  },
  componentDidReceiveProps: function(update) {
    this.setState({
      isActive: update.isActive
    });
  },
  handleClick: function() {
    this.props.dispatch({
      type: 'MY_EVENT'
    });
  },
  handleIsActiveChange: function(view, isActive) {
    this.$el.toggleClass('active', isActive);
  }
}));
```
You can also put `mapStateToProps` as a property on the View itself, like so:
```js
var ConnectedView = MarionetteRedux.connect()(Marionette.View.extend({
  mapStateToProps: function(state) {
    return {
      isActive: state.isActive
    }
  }
}));
```
`mapDispatchToProps` is available as well, and can be used like so:
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
Or, like `mapStateToProps`, `mapDispatchToProps` can be passed to `connect` as well:
```js
var ConnectedView = MarionetteRedux.connect(null, mapDispatchToProps)(Marionette.View.extend({
    …
}));
```
### `Backbone.Model` and `Backbone.Collection`
You can `connect` `Backbone.Model` and `Backbone.Collection` as well!
```js
var mapStateToProps = function(state) {
  return {
    currency: state.currency
  }
}
var Model = Backbone.Model.extend({
  store: store,
  mapStateToProps: function(state) {
    return {
      currency: state.currency
    }
  },
  componentDidReceiveProps: function(update) {
    this.set({
      currency: update.currency
    })
  }
});
var ConnectedModel = MarionetteRedux.connect(mapStateToProps)(Model);
```
### `mixin`
If you'd rather use a mixin instead of `connect`, you can do so like this:
```js
Marionette.View.extend(mixin);
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
    console.log("Foo changed to " + foo + "!"); // Foo changed to bar!
  }
}));
var connectedView = new ConnectedView();
connectedView.setState({ foo: 'bar' }); // or connectedView.setState('foo', 'bar');
connectedView.getState('foo'); // "bar"
```

## License

MIT
