const gulp = require('gulp');
const rename = require('gulp-rename');
const webpack = require('webpack-stream');
const path = require('path');

const compileJs = () => {
	try {
		return gulp.src('./markdown-wysiwyg.js')
		.pipe(webpack({
			entry: './markdown-wysiwyg.js',
			output: {
				path		: path.resolve(__dirname, 'dist'),
				filename	: 'markdown-wysiwyg.js',
			},
			//mode: "development",
			mode: "production",
			module: {
				rules: [
					{
						test: /\.scss$/i,
						use: ['to-string-loader', 'css-loader', 'sass-loader'],
					},
				],
			},
		}))
		.pipe(rename('markdown-wysiwyg.js'))
		.pipe(gulp.dest('dist/'));
	} catch(e) {console.error(e);}
};
gulp.task('default', compileJs);

//gulp.watch(['./markdown-wysiwyg.js', '*.scss'], compileJs);
