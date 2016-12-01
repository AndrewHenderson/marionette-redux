Marionette Redux
=========================

[Marionette](https://github.com/marionettejs/backbone.marionette) bindings for [Redux](https://github.com/reactjs/redux).  
Performant and flexible.

## Installation

```
npm install --save marionette-redux
```

This assumes that you’re using [npm](http://npmjs.com/) package manager with a module bundler like [Webpack](http://webpack.github.io) or [Browserify](http://browserify.org/) to consume [CommonJS modules](http://webpack.github.io/docs/commonjs.html).

If you don’t yet use [npm](http://npmjs.com/) or a modern module bundler, and would rather prefer a single-file [UMD](https://github.com/umdjs/umd) build that makes `MarionetteRedux` available as a global object.

## Documentation

- [API](docs/api.md#api)
  - [`connect([mapStateToProps], [mapDispatchToProps], [mergeProps], [options])`](docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options)
  - [`mixin`](docs/api.md#mixin)
- [Troubleshooting](docs/troubleshooting.md#troubleshooting)

## How Does It Work?

By providing a way to bind a Redux store to the Marionette View and/or Backbone Model/Collection lifecycles.

There is an excellent video on how React Redux works in [this readthesource episode](https://www.youtube.com/watch?v=VJ38wSFbM3A).

If you understand that and Marionette, you should be ready to apply Marionette Redux in your applicaltion.

You can also check out some demos below or the [examples](https://github.com/AndrewHenderson/marionette-redux/tree/master/examples). Enjoy!

## Demo
### `connect`
Marionette Redux allows you to `connect` any Marionette or Backbone "component" to the Redux store. Here's an example of a `Marionette.View`. The following could just as easily be a `Marionette.Behavior`:
```js
var mapStateToProps = 
var ConnectedView = MarionetteRedux.connect(mapStateToProps)(Marionette.View.extend({
  store: store,
  events: {
    click: 'handleClick'
  },
  stateEvents: {
    'change:isActive': 'handleChangeisActive'
  },
  handleClick: function() {
    this.props.dispatch({
      type: 'MY_EVENT'
    });
  },
  getInitialState: function() {
    return: {
      isActive: false
    }
  },
  componenetDidReceiveProps: function(update) {
    this.setState({
      isActive: update.isActive
    });
  },
  handleChangeIsActive: function(view, isActive) {
    this.$el.toggleClass('active', isActive);
  }
}));
```
* Note: `store` is placed on the View, but `connect` will also look on `window.store` as a last resort. *
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
Or, like mapStateToProps, this can be on the passed to `connect` as well:
```js
var ConnectedView = MarionetteRedux.connect(mapDispatchToProps)(Marionette.View.extend({
    . . .
}));
```
### `Backbone.Model` and `Backbone.Collection`
You can `connect` `Backbone.Model` and `Backbone.Collection` as well!
```js
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
var ConnectedModel = MarionetteRedux.connect()(Model);
```
### `mixin`
If you'd rather use a mixin instead of `connect`, you can do so like this:
```js
Marionette.View.extend(_.extend({
 . . .
}, mixin));
```
### `setState` and `getState`
We've also added the `setState` and `getState` for convenient view layer state event changes. This works exactly the same as Marionette's `modelEvents` listeners, using the `stateEvents` object to define listeners.

## License

MIT
