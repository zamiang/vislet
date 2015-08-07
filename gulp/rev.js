var gulp = require('gulp');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
var config = require("./config.js");
var uglify = require("gulp-uglify");

// compress public assets
gulp.task("compress", ['scripts', "revision", "revreplace"], function(cb) {
  gulp.src(config.public + "/*/*.js")
    .pipe(uglify())
    .pipe(gulp.dest(config.public))
    .on('end', cb);
});

// copy assets to /public/* and attach asset hash to filenames
gulp.task("revision", ["scripts", "styles"], function() {
  return gulp.src(["./dist/css/*.css", "./dist/js/*.js"], { base: config.dest })
    .pipe(rev())
    .pipe(gulp.dest(config.public))
    .pipe(rev.manifest())
    .pipe(gulp.dest(config.dest));
});

// copy html files into /public and edit asset references to include asset hash
gulp.task("revreplace", ["revision"], function(){
  var manifest = gulp.src(config.dest + "/rev-manifest.json");

  return gulp.src(["./dist/**/*.html"], { base: config.dest })
    .pipe(revReplace({ manifest: manifest }))
    .pipe(gulp.dest(config.public));
});
