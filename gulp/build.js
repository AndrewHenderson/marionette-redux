import gulp from 'gulp';
import plumber from 'gulp-plumber';
import file from 'gulp-file';
import filter from 'gulp-filter';
import rename from 'gulp-rename';
import sourcemaps from 'gulp-sourcemaps';
import uglify from 'gulp-uglify';
import runSequence from 'run-sequence';

import { rollup } from 'rollup';
import babel from 'rollup-plugin-babel';
import 'babel-preset-es2015-rollup';
import json from 'rollup-plugin-json';
import nodeResolve from 'rollup-plugin-node-resolve';

import banner from  './_banner';
import {name} from '../package.json';

const srcPath = 'src/';
const buildPath = 'dist/';

function _generate(bundle){
  return bundle.generate({
    format: 'umd',
    moduleName: 'MarionetteRedux',
    sourceMap: true,
    banner: banner,
    globals: {
      'underscore': '_',
      'marionette': 'Marionette'
    }
  });
}

function bundle() {
  return rollup({
    entry: srcPath + name + '.js',
    external: ['underscore', 'marionette'],
    plugins: [
      json(),
      nodeResolve({
        main: true
      }),
      babel({
        presets: [["es2015", {"modules": false}]],
        sourceMaps: true,
        babelrc: false,
        exclude: 'node_modules/**'
      })
    ]
  }).then(function(bundle) {
    return _generate(bundle);
  }).then(function(gen) {
      gen.code += '\n//# sourceMappingURL=' + gen.map.toUrl();
    return gen;
  })
}

gulp.task('build-lib', ['lint-src'], function(){
  return bundle().then(function(gen) {
    return file(name + '.js', gen.code, {src: true})
      .pipe(plumber())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(buildPath))
      .pipe(filter(['**', '!**/*.js.map']))
      .pipe(rename(name + '.min.js'))
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(uglify({
        preserveComments: 'license'
      }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(buildPath));
  })
});

gulp.task('build', function(done) {
  runSequence('build-lib', done);
});
