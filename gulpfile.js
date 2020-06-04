const gulp = require('gulp');
const rename = require('gulp-rename');
const webpack = require('webpack-stream');
const path = require('path');

gulp.task('default', () => {
	return gulp.src('./markdown-wysiwyg.js')
	.pipe(webpack({
		entry: './markdown-wysiwyg.js',
		output: {
			path		: path.resolve(__dirname, 'dist'),
			filename	: 'markdown-wysiwyg.js',
		},
	}))
	.pipe(rename('markdown-wysiwyg.js'))
	.pipe(gulp.dest('dist/'));
});




const jsdoc2md = require('jsdoc-to-markdown')
const fs = require('jsdoc-to-markdown')
const H = require('upperh');
gulp.task('docs', async (done) => {
	var output = await jsdoc2md.render({
		files		: 'markdown-wysiwyg.js',
		template	: await H.readFile('./readme-template.md'),
	})
	console.log(output);
	await H.writeFile('./README.md', output);
	return done();
})
