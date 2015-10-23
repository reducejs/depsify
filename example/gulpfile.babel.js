import gulp from 'gulp'
import depsify from '../lib/main'
import path from 'path'
import del from 'del'
import postcss from 'postcss'
import url from 'postcss-url'
import source from 'vinyl-source-stream'

var processor = postcss([
  require('postcss-import')(),
  require('postcss-url')({ url: 'copy', assetsPath: 'i' }),
  require('postcss-advanced-variables')(),
])

var fixtures = path.resolve.bind(path, __dirname, 'src')
var DEST = path.join(__dirname, 'build')
var common = path.join(DEST, 'common.css')

gulp.task('clean', function () {
  return del(DEST)
})

gulp.task('default', ['clean'], function () {
  return depsify({
    basedir: fixtures(),
    entries: ['a.css', 'b.css'],
    processor: function (result) {
      return processor.process(result.css, {
        from: result.from,
        to: common,
      })
      .then(function (res) {
        result.css = res.css
      })
    },
  })
  .bundle()
  .pipe(source('common.css'))
  .pipe(gulp.dest(DEST))
})

