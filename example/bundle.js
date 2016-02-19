var depsify = require('../')
var path = require('path')
var del = require('del')

var fixtures = path.resolve.bind(path, __dirname)
var DEST = fixtures('build')

var atImport = require('postcss-simple-import')
var url = require('postcss-custom-url')
var vars = require('postcss-advanced-variables')

del(DEST).then(function () {
  depsify({
    basedir: fixtures('src'),
    entries: ['a.css', 'b.css'],
    processor: [
      atImport(),
      url(url.util.inline),
      vars(),
    ],
  })
  .bundle()
  .pipe(process.stdout)
})

