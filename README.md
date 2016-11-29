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
Enjoy!

## License

MIT