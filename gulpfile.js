var gulp = require('gulp');
var server = require('gulp-server-livereload');
var requireDir = require('require-dir');
requireDir('./gulp/');

// Commonly used tasks
gulp.task("watch", function() {
  gulp.watch(["./components/**/*.coffee", "./apps/**/*.coffee"], ["scripts"]);
  gulp.watch(["./apps/**/*.styl", "./components/**/*.styl"], ["styles"]);
  gulp.watch(["./apps/*/templates/index.jade"], ["templates"]);
});

gulp.task("default", ["scripts", "styles", "images", "templates"]);
gulp.task("publish", ["publish-html", "publish-scripts", "publish-styles", "publish-images"]);
gulp.task("s", ["server"]);
