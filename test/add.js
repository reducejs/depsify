var test = require('tap').test
var Depsify = require('../')
var path = require('path')
var sink = require('sink-transform')
var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

var fileCache = {}
fileCache[fixtures('a')] = '@deps "./c";\n@deps "./b";\na{}'
fileCache[fixtures('b')] = '@deps "./c";\nb{}'
fileCache[fixtures('c')] = 'c{}'

test('file', function(t) {
  t.plan(1)
  var b = bundler()
  b.add('./a')
  b.add('./b')
  b.bundle().pipe(compare(t))
})

test('object', function(t) {
  t.plan(1)
  var b = bundler()
  b.add({ file: './a' })
  b.add({ file: './b' })
  b.bundle().pipe(compare(t))
})

test('source', function(t) {
  t.plan(1)
  var b = new Depsify({
    basedir: fixtures(),
    resolve: function (file, parent) {
      return path.resolve(parent.basedir, file)
    },
  })
  b.add({ file: './a', source: fileCache[fixtures('a')] })
  b.add({ file: './b', source: fileCache[fixtures('b')] })
  b.add({ file: './c', source: fileCache[fixtures('c')] })
  b.bundle().pipe(compare(t))
})

test('options', function(t) {
  t.plan(1)
  var b = new Depsify({
    basedir: fixtures(),
    fileCache: fileCache,
    resolve: function (file, parent) {
      return path.resolve(parent.basedir, file)
    },
    entries: [{ file: './a' }, { file: './b' }],
  })
  b.bundle().pipe(compare(t))
})

test('array', function(t) {
  t.plan(1)
  var b = bundler()
  b.add([{ file: './a' }, { file: './b' }])
  b.bundle().pipe(compare(t))
})

function bundler() {
  return new Depsify({
    basedir: fixtures(),
    resolve: function (file, parent) {
      return path.resolve(parent.basedir, file)
    },
    fileCache: fileCache,
  })
}

function compare(t) {
  return sink.str(function (body, done) {
    t.equal(body, 'c{}b{}a{}')
    done()
  })
}

