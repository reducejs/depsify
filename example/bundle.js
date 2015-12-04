var depsify = require('../')
var path = require('path')
var del = require('del')

var fixtures = path.resolve.bind(path, __dirname)
var DEST = fixtures('build')

del(DEST).then(function () {
  depsify({
    basedir: fixtures('src'),
    entries: ['a.css', 'b.css'],
    processor: [
      require('postcss-import')(),
      require('postcss-url')({ url: 'inline' }),
      require('postcss-advanced-variables')(),
    ],
  })
  .bundle()
  .pipe(process.stdout)
})

