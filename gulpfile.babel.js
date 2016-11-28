import gulp from 'gulp';
import 'babel-polyfill';
import './gulp/linting';
import './gulp/test';
import './gulp/build';

gulp.task('watch-code', function() {
  gulp.watch(['src/**/*'], ['lint-code']);
});

// Run the linter and headless unit tests as you make changes.
gulp.task('watch', ['watch-code']);

// Run linter, tests
gulp.task('default');
