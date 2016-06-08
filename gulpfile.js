var gulp          = require('gulp');
var gutil         = require('gulp-util');
var sass          = require('gulp-sass');
var plumber       = require('gulp-plumber');
var minifyCss     = require('gulp-minify-css');

var onError = function (err) {
	console.log(
		'ERROR! Oh no, it seems that something went wrong!',
		'\n- Plugin: ' + gutil.colors.red(err.plugin),
		'\n- Error: ' + gutil.colors.red(err.message)
	)
};

gulp.task('sass', function() {
	gulp.src('assets/scss/style.scss')
	.pipe(plumber(onError))
	.pipe(sass())
	.pipe(minifyCss({
		keepSpecialComments: 0
	}))
	.pipe(gulp.dest('assets/css/'))
});

gulp.task('watch', function() {
	gulp.watch('assets/scss/**/*.scss', ['sass']);
});