var depsify = require('../')
var path = require('path')
var del = require('del')
var postcss = require('postcss')
var url = require('postcss-url')

var processor = postcss([
  require('postcss-import')(),
  require('postcss-url')({ url: 'inline' }),
  require('postcss-advanced-variables')(),
])

var fixtures = path.resolve.bind(path, __dirname, 'src')
var DEST = path.join(__dirname, 'build')
var common = path.join(DEST, 'common.css')

del(DEST).then(function () {
  depsify({
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
  .pipe(process.stdout)
})

