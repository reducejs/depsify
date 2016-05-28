var test = require('tap').test
var Depsify = require('../')
var path = require('path')
var sink = require('sink-transform')
var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('custome resolve', function(t) {
  t.plan(1)
  var b = new Depsify({
    basedir: fixtures(),
    resolve: function (file) {
      return fixtures(file)
    },
  })
  b.add({
    file: './a.css',
    source: '@deps "c.css";.a{}',
  })
  b.add({
    file: './b.css',
    source: '.b{}',
  })
  b.add({
    file: './c.css',
    source: '.c{}',
  })
  b.bundle().pipe(sink.str(function (body, done) {
    t.equal(body, '.c{}.a{}.b{}')
    done()
  }))
})

test('node-style resolve', function(t) {
  t.plan(1)
  var b = new Depsify('./resolve/a.css', {
    basedir: fixtures(),
  })
  b.bundle().pipe(sink.str(function (body, done) {
    t.equal(body.replace(/\s+/g, ''), '.color{}.b{}.a{}')
    done()
  }))
})

