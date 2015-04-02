'use strict';

var gulp = require('gulp');
var babel = require("gulp-babel");
var plumber = require('gulp-plumber');

gulp.task("build", function () {
    gulp.src("src/**/*.js")
        .pipe(plumber())
        .pipe(babel())
        .pipe(gulp.dest("."));
});

gulp.task('watch', ['build'], function () {
    gulp.watch('src/**/*.js', ['build']);
});

gulp.task('default', ['watch']);
