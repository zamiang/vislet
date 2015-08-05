var gulp = require('gulp');
var coffee = require('gulp-coffee');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var del = require('del');
var jade = require('gulp-jade');
var stylus = require('gulp-stylus');

var paths = {
  scripts: ['assets/*.coffee'],
  styles: ['assets/*.styl'],
  templates: ['apps/*/templates/*.jade']
};

gulp.task('clean', function(cb) {
  del(['build'], cb);
});

gulp.task('scripts', ['clean'], function() {
  return gulp.src(paths.scripts)
    .pipe(coffee())
    .pipe(uglify())
    .pipe(gulp.dest('build/js'));
});

gulp.task('styles', function () {
  gulp.src(paths.styles)
    .pipe(stylus())
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('templates', function() {
  var YOUR_LOCALS = {};

  gulp.src(paths.templates)
    .pipe(jade({
      locals: 'YOUR_LOCALS'
    }))
    .pipe(gulp.dest('./build/'));
});


// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['scripts']);
  gulp.watch(paths.styles, ['styles']);
  gulp.watch(paths.templates, ['templates']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['watch', 'scripts', 'styles','templates']);
