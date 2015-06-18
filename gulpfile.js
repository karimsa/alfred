/**
 * gulpfile.js - alfred
 * build tasks.
 * 
 * Licensed under GPLv3.
 * Copyright (C) 2015 Karim Alibhai.
 */

'use strict';

var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    beautify = require('gulp-jsbeautifier'),
    stylish = require('jshint-stylish');

gulp.task('beautify', function () {
    return gulp.src(['*.js', 'test/**.js'])
        .pipe(beautify({
            js: {
                jslintHappy: true
            }
        }))
        .pipe(gulp.dest(function (file) {
            return file.base;
        }));
});

gulp.task('default', ['beautify'], function () {
    return gulp.src(['*.js', 'test/**.js'])
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
});
