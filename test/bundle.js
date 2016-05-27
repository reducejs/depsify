var test = require('tap').test
var Depsify = require('../')
var path = require('path')
var sink = require('sink-transform')
var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('method', function(t) {
  t.plan(1)
  var b = bundler()
  b.bundle().pipe(compare(t))
})

test('rebundle', function(t) {
  t.plan(2)
  var b = bundler()
  b.on('reset', function () {
    t.ok(true)
  })
  b.bundle()
  b.bundle().pipe(compare(t))
})

test('event', function(t) {
  t.plan(1)
  var b = bundler()
  b.on('bundle', function (stream) {
    stream.pipe(compare(t))
  })
  b.bundle()
})

function bundler() {
  var cache = {
    '/a': '@deps "./c";a{}',
    '/b': '@deps "./c";b{}',
    '/c': 'c{}',
  }
  var b = new Depsify({
    basedir: '/',
    entries: ['./a', './b'],
    resolve: function (file, parent) {
      return path.resolve(parent.basedir, file)
    },
    readFile: function (file) {
      return cache[file]
    },
  })

  b.plugin('watermark', {
    basedir: fixtures(),
    mark: 'api',
  })

  return b
}

function compare(t) {
  return sink.str(function (body) {
    t.same(body, 'c{}\n/* api */\na{}\n/* api */\nb{}\n/* api */\n')
    this.push(null)
  })
}

