var gulp          = require('gulp');
var gutil         = require('gulp-util');
var sass          = require('gulp-sass');
var plumber       = require('gulp-plumber');
var minifyCss     = require('gulp-minify-css');
var autoprefixer  = require('gulp-autoprefixer');

var onError = function (err) {
	console.log(
		'ERROR! Oh no, it seems that something went wrong!',
		'\n- Plugin: ' + gutil.colors.red(err.plugin),
		'\n- Error: ' + gutil.colors.red(err.message)
	)
};

gulp.task('sass', function() {
	gulp.src('public/assets/scss/style.scss')
	.pipe(plumber(onError))
	.pipe(sass())
	.pipe(autoprefixer('last 3 version', 'ie 8', 'ie 9'))
	.pipe(minifyCss({
		keepSpecialComments: 0
	}))
	.pipe(gulp.dest('public/assets/css/'))
});

gulp.task('watch', function() {
	gulp.watch('public/assets/scss/**/*.scss', ['sass']);
});
