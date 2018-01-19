import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import replace from 'rollup-plugin-replace'
import commonjs from 'rollup-plugin-commonjs'
import uglify from 'rollup-plugin-uglify'

const env = process.env.NODE_ENV;

export default {
  entry: 'src/index.js',
  dest: 'dist/marionette-redux.js',
  external: [
    'underscore'
  ],
  globals: {
    'underscore': '_'
  },
  format: 'umd',
  moduleName: 'MarionetteRedux',
  plugins: [
    resolve(),
    babel({
      exclude: '**/node_modules/**'
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env)
    })
  ]
}

if (env === 'production') {
  config.plugins.push(
    uglify({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false
      }
    })
  )
}
