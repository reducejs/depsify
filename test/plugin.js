var test = require('tap').test
var Depsify = require('../')
var path = require('path')
var sink = require('sink-transform')
var fixtures = path.resolve.bind(path, __dirname, 'fixtures')
var Transform = require('stream').Transform

test('api', function(t) {
  t.plan(1)
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

  b.bundle().pipe(sink.str(function (body) {
    t.same(body, 'c{}\n/* api */\na{}\n/* api */\nb{}\n/* api */\n')
    this.push(null)
  }))
})

test('option', function(t) {
  t.plan(1)
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
    plugin: [['watermark', {
      basedir: fixtures(),
      mark: 'api',
    }]],
  })

  b.bundle().pipe(sink.str(function (body) {
    t.same(body, 'c{}\n/* api */\na{}\n/* api */\nb{}\n/* api */\n')
    this.push(null)
  }))
})

test('function', function(t) {
  t.plan(1)
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

  b.plugin(watermark, {
    basedir: fixtures(),
    mark: 'api',
  })

  b.bundle().pipe(sink.str(function (body) {
    t.same(body, 'c{}\n/* api */\na{}\n/* api */\nb{}\n/* api */\n')
    this.push(null)
  }))
})

function watermark(b, opts) {
  b.pipeline.get('deps').push(Transform({
    objectMode: true,
    transform: function (row, enc, next) {
      row.source += '\n/* ' + opts.mark + ' */\n'
      next(null, row)
    },
  }))
}

