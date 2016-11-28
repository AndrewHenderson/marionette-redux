import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';

export default {
  dest: 'dist/marionette-redux.js',
  entry: 'src/marionette-redux.js',
  external: ['underscore', 'backbone'],
  format: 'umd',
  globals: {
    'backbone': 'Backbone',
    'underscore': '_'
  },
  moduleName: 'JsonApi',
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),
    json()
  ]
}
