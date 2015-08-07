var gulp = require('gulp');
var server = require('gulp-server-livereload');
var config = require('./config');

gulp.task('server', function() {
  gulp.src(config.dest)
    .pipe(server({
      livereload: false, // livereload does not work well :(
      open: true
    }));
});
