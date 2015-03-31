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

gulp.task('watch', function () {
    gulp.run('build');

    gulp.watch('src/**/*.js', function(event) {
        gulp.run('js');
    })
});

gulp.task('default', function () {
    gulp.run('watch');
});
