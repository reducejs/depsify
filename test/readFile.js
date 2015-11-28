var test = require('tap').test
var Depsify = require('../')
var path = require('path')
var sink = require('sink-transform')
var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('readFile', function(t) {
  t.plan(2)
  var A = {
    source: 'aa{}',
    deps: {},
  }
  var B = {
    source: 'bb{}',
    deps: {},
  }
  var cache = {}
  cache[fixtures('a.css')] = A
  cache[fixtures('b.css')] = B
  var d = Depsify({
    basedir: fixtures(),
    resolve: function (file) {
      return Promise.resolve(fixtures(file))
    },
    readFile: function (file) {
      return Promise.resolve(path.basename(file, '.css') + '{}')
    },
    cache: cache,
  })
  d.add(['./b.css', './a.css'])
  d.bundle().pipe(sink.str(function (body) {
    t.equal(body, 'aa{}bb{}')
    this.push(null)

    delete cache[fixtures('a.css')]
    d.bundle().pipe(sink.str(function (src) {
      t.equal(src, 'a{}bb{}')
      this.push(null)
    }))
  }))
})

