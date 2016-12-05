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

My personal goal is to allow the codebase I work on to migrate the business logic out of `Backbone.Model`s and `Backbone.Collection`s and into Redux. Thus, creating a shared API that can be leveraged by both connected `Marionette.View`s and `React.Component`s.

Newer components can then be written in React and the data kept in sync with the existing `Mariontte.View` models and collections. The Marionette views themselves can then be more easily be rewritten when time allows.

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
## `componentDidReceiveProps`

__The most noteworthy part of the previous example is `componentDidReceiveProps` which passes any changes that have been described in the object returned by `mapStateToProps`.__

## `mapStateToProps` and `mapDispatchToProps`

These work exactly as they do in React Redux.

`mapStateToProps` can be passed to `connect` as the first argument or as a property on the `View` itself, like so:
```js
var ConnectedView = MarionetteRedux.connect()(Marionette.View.extend({
  mapStateToProps: function(state) {
    return {
      isActive: state.isActive
    }
  }
}));
```

`mapDispatchToProps` can be provided as the second argument or on the `View` itself like so:

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

Or:

```js
var ConnectedView = MarionetteRedux.connect(null, mapDispatchToProps)(Marionette.View.extend({
    …
}));
```

### `Backbone.Model` and `Backbone.Collection`

You can `connect` `Backbone.Model`s and `Backbone.Collection`s as well!

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
