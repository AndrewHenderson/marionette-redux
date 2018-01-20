import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import replace from 'rollup-plugin-replace'
import uglify from 'rollup-plugin-uglify'

const env = process.env.NODE_ENV;

const config = {
  entry: 'src/index.js',
  dest: 'dist/marionette-redux.js',
  external: [
    'underscore',
    'marionette'
  ],
  globals: {
    'underscore': '_',
    'marionette': 'Marionette'
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
};

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

export default config;
