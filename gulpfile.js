var gulp = require("gulp");
var coffee = require("gulp-coffee");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
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
var s3 = require('gulp-s3');
var fs = require('fs');
var server = require('gulp-server-livereload');
var gzip = require('gulp-gzip');

var paths = {
  scripts: ["assets/*.coffee"],
  styles: ["assets/*.styl"],
  images: ["images/*"],
  templates: ["apps/*/templates/index.jade"]
};

var aws = JSON.parse(fs.readFileSync('./aws.json'));
var defaultCacheControl = "max-age=315360000, no-transform, public";

gulp.task("clean", function(cb) {
  del(["dist"], cb);
});

gulp.task('server', function() {
  gulp.src('./dist')
    .pipe(server({
      livereload: false, // does not work well
      open: true
    }));
});

gulp.task("scripts", function(done) {
  glob(paths.scripts[0], function(err, files) {
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
        .pipe(gulp.dest("./dist/js"));
    });
    es.merge(tasks).on("end", done);
  });
});

gulp.task("styles", function () {
  gulp.src(paths.styles)
    .pipe(stylus())
    .pipe(minifyCss())
    .pipe(gulp.dest("./dist/css"));
});

gulp.task("templates", function() {
  var LOCALS = {
    JS_EXT: ".js",
    CSS_EXT: ".css",
    APP_URL: "http://www.vislet.com",
    NODE_ENV: process.env.NODE_ENV
  };

  gulp.src(paths.templates)
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
    .pipe(gulp.dest("./dist"));
});

gulp.task("images", function() {
  return gulp.src(paths.images)
    .pipe(imagemin({optimizationLevel: 5}))
    .pipe(gulp.dest("./dist/img"));
});

gulp.task("compress", ['scripts'], function(cb) {
  gulp.src("./dist/*/*.js")
    .pipe(uglify())
    .pipe(gulp.dest("./dist"))
    .on('end', cb);
});

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

gulp.task("watch", function() {
  gulp.watch(["./components/**/*.coffee", "./apps/**/*.coffee"], ["scripts"]);
  gulp.watch(["./apps/**/*.styl", "./components/**/*.styl"], ["styles"]);
  gulp.watch(paths.templates, ["templates"]);
});

gulp.task("default", ["scripts", "styles", "images", "templates"]);
gulp.task("publish", ["publish-html", "publish-scripts", "publish-styles", "publish-images"]);
