var test = require('tap').test
var Depsify = require('../')
var path = require('path')
var sink = require('sink-transform')
var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('source input', function(t) {
  t.plan(1)
  var d = Depsify({
    basedir: fixtures(),
  })
  d.add([
    {
      file: './a.css',
      source: '.a{}',
    },
    {
      file: './b.css',
      source: '.b{}',
    },
  ])
  d.bundle().pipe(sink.str(function (body, done) {
    t.equal(body, '.a{}.b{}')
    done()
  }))
})

