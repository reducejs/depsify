var test = require('tap').test
var Depsify = require('../')
var path = require('path')
var sink = require('sink-transform')
var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('processor', function(t) {
  t.plan(1)
  var d = Depsify({
    basedir: fixtures(),
    resolve: function (file) {
      return Promise.resolve(fixtures(file))
    },
    readFile: function (file) {
      return Promise.resolve(path.basename(file, '.css') + '{}')
    },
  })
  d.add(['./b.css', './a.css'])
  d.processor([prefixer, 'x-'])
  d.bundle().pipe(sink.str(function (body) {
    t.equal(body, 'x-a{}x-b{}')
    this.push(null)
  }))
})

function prefixer(result, prefix) {
  var css = result.css
  css = prefix + css.replace(/\s+/, '')
  result.css = css
}

