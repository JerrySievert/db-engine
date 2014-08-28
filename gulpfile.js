var gulp = require('gulp');
var complex = require('gulp-escomplex');
var complexreporter = require('gulp-escomplex-reporter-json');
var jshint = require('gulp-jshint');
var shell = require('gulp-shell');

var pack = require('./package.json');

gulp.task('complexity', function () {
  gulp.src([
    'index.js',
    'lib/*.js'
  ])
  .pipe(complex({
    packageName: pack.name,
    packageVersion: pack.version
  }))
  .pipe(complexreporter())
  .pipe(gulp.dest('complexity'));
});

gulp.task('jshint', function () {
  gulp.src([
    'index.js',
    'lib/*.js'
  ])
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(jshint.reporter('fail'));
});

gulp.task('test', shell.task([
  './node_modules/istanbul/lib/cli.js cover ./node_modules/vows/bin/vows --spec'
]));

gulp.task('default', [ 'test', 'jshint', 'complexity' ], function () {

});
