var test = require('tap').test
var Depsify = require('../')
var path = require('path')
var sink = require('sink-transform')
var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('custome resolve', function(t) {
  t.plan(1)
  var d = Depsify({
    basedir: fixtures(),
    resolve: function (file) {
      return Promise.resolve(fixtures(file))
    },
  })
  d.add({
    file: './a.css',
    source: '@deps "c.css";.a{}',
  })
  d.add({
    file: './b.css',
    source: '.b{}',
  })
  d.add({
    file: './c.css',
    source: '.c{}',
  })
  d.bundle().pipe(sink.str(function (body, done) {
    t.equal(body, '.c{}.a{}.b{}')
    done()
  }))
})

test('node-style resolve', function(t) {
  t.plan(1)
  var d = Depsify('./resolve/a.css', {
    basedir: fixtures(),
  })
  d.bundle().pipe(sink.str(function (body, done) {
    t.equal(body.replace(/\s+/g, ''), '.color{}.b{}.a{}')
    done()
  }))
})

