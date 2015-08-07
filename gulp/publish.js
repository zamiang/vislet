var gulp = require("gulp");
var s3 = require('gulp-s3');
var gzip = require('gulp-gzip');
var config = require('./config.js');

// TODO: Combine publish tasks
gulp.task("publish-html", ['default', 'compress'], function(cb) {
  var options = {
    headers: {
      "Cache-Control": defaultCacheControl,
      'charset': 'utf-8',
      'Content-Type': 'text/html'
    }};

  gulp.src("./dist/**/*.html")
    .pipe(s3(aws, options))
    .on('end', cb);
});

gulp.task("publish-images", ['default', 'compress'], function(cb) {
  var options = {
    headers: {
      "Cache-Control": defaultCacheControl
    }};

  gulp.src(["./dist/*/*.png","./dist/**/*.jpg"])
    .pipe(s3(aws, options))
    .on('end', cb);
});

gulp.task("publish-scripts", ['default', 'compress'], function(cb) {
  var options = {
    headers: {
      "Cache-Control": defaultCacheControl,
      'Content-Encoding': 'gzip',
      'Content-Type': 'application/javascript',
      'charset': 'utf-8'
    }};

  gulp.src("./dist/*/*.js")
    .pipe(gzip({ append: false }))
    .pipe(s3(aws, options))
    .on('end', cb);
});

gulp.task("publish-styles", ['default', 'compress'], function(cb) {
  var options = {
    headers: {
      "Cache-Control": defaultCacheControl,
      'Content-Encoding': 'gzip',
      'Content-Type': 'text/css',
      'charset': 'utf-8'
    }};

  gulp.src("./dist/*/*.css")
    .pipe(gzip({ append: false }))
    .pipe(s3(aws, options))
    .on('end', cb);
});
