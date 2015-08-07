var gulp = require("gulp");
var s3 = require('gulp-s3');
var gzip = require('gulp-gzip');
var config = require('./config.js');

// TODO: Combine publish tasks
gulp.task("publish-html", ['assets', 'compress'], function(cb) {
  var options = {
    headers: {
      "Cache-Control": config.defaultCacheControl,
      'charset': 'utf-8',
      'Content-Type': 'text/html'
    }};

  gulp.src("./public/**/*.html")
    .pipe(s3(config.aws, options))
    .on('end', cb);
});

gulp.task("publish-images", ['assets', 'compress'], function(cb) {
  var options = {
    headers: {
      "Cache-Control": config.defaultCacheControl
    }};

  // Images are still in dest - no need to move them to public
  gulp.src(["./dest/**/*.png","./dest/**/*.jpg"])
    .pipe(s3(config.aws, options))
    .on('end', cb);
});

gulp.task("publish-scripts", ['assets', 'compress'], function(cb) {
  var options = {
    headers: {
      "Cache-Control": config.defaultCacheControl,
      'Content-Encoding': 'gzip',
      'Content-Type': 'application/javascript',
      'charset': 'utf-8'
    }};

  gulp.src("./public/**/*.js")
    .pipe(gzip({ append: false }))
    .pipe(s3(config.aws, options))
    .on('end', cb);
});

gulp.task("publish-styles", ['assets', 'compress'], function(cb) {
  var options = {
    headers: {
      "Cache-Control": config.defaultCacheControl,
      'Content-Encoding': 'gzip',
      'Content-Type': 'text/css',
      'charset': 'utf-8'
    }};

  gulp.src("./public/**/*.css")
    .pipe(gzip({ append: false }))
    .pipe(s3(config.aws, options))
    .on('end', cb);
});
