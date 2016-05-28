var test = require('tap').test
var Depsify = require('../')
var path = require('path')
var sink = require('sink-transform')
var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('api', function(t) {
  t.plan(1)
  var d = new Depsify({
    basedir: fixtures(),
    resolve: function (file) {
      return Promise.resolve(fixtures(file))
    },
    readFile: function (file) {
      return Promise.resolve(path.basename(file, '.css') + '{}')
    },
  })
  d.add(['./b.css', './a.css'])
  d.transform(prefixer)
  d.bundle().pipe(sink.str(function (body) {
    t.equal(body, 'x-a{}x-b{}')
    this.push(null)
  }))
})

test('option', function(t) {
  t.plan(1)
  var d = new Depsify({
    basedir: fixtures(),
    resolve: function (file) {
      return Promise.resolve(fixtures(file))
    },
    readFile: function (file) {
      return Promise.resolve(path.basename(file, '.css') + '{}')
    },
    transform: prefixer,
  })
  d.add(['./b.css', './a.css'])
  d.bundle().pipe(sink.str(function (body) {
    t.equal(body, 'x-a{}x-b{}')
    this.push(null)
  }))
})

function prefixer(result) {
  var css = result.css
  css = 'x-' + css.replace(/\s+/, '')
  result.css = css
}

