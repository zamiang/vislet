// Scripts for compiling assets and jade templates
var gulp = require("gulp");
var coffee = require("gulp-coffee");
var del = require("del");
var jade = require("gulp-jade");
var stylus = require("gulp-stylus");
var minifyCss = require("gulp-minify-css");
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var rename = require("gulp-rename");
var glob = require("glob");
var es = require("event-stream");
var imagemin = require('gulp-imagemin');
var config = require('./config');

var LOCALS = {
  JS_EXT: ".js",
  CSS_EXT: ".css",
  APP_URL: "http://www.vislet.com",
  NODE_ENV: process.env.NODE_ENV
};

gulp.task("clean", function(cb) {
  del(["dist", "public"], cb);
});

gulp.task("scripts", function(done) {
  glob(config.paths.scripts[0], function(err, files) {
    if (err) done(err);
    var tasks = files.map(function(entry) {
      return browserify({ entries: [entry] })
        .transform("coffeeify")
        .transform("jadeify")
        .bundle()
        .pipe(source(entry))
        .pipe(rename({
          extname: ".js",
          dirname: ""
        }))
        .pipe(gulp.dest(config.dest + "/js"));
    });
    es.merge(tasks).on("end", done);
  });
});

gulp.task("styles", function () {
  gulp.src(config.paths.styles)
    .pipe(stylus())
    .pipe(minifyCss())
    .pipe(gulp.dest(config.dest + "/css"));
});

gulp.task("templates", function() {
  gulp.src(config.paths.templates)
    .pipe(jade({
      locals: LOCALS
    }))
    .pipe(rename(function (path) {
      path.dirname = path.dirname.replace("/templates", "");

      // Move the home app template to index.html
      if (path.dirname == "home") {
        path.dirname = "";
      }
    }))
    .pipe(gulp.dest(config.dest));
});

gulp.task("images", function() {
  return gulp.src(config.paths.images)
    .pipe(imagemin({optimizationLevel: 5}))
    .pipe(gulp.dest(config.dest + "/img"));
});
