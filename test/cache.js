var test = require('tap').test
var Depsify = require('../')
var path = require('path')
var sink = require('sink-transform')
var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('cache', function(t) {
  t.plan(2)
  var A = {
    source: '.a{}',
    deps: {},
  }
  var B = {
    source: '.b{}',
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
    cache: cache,
  })
  d.add(['./b.css', './a.css'])

  d.bundle().pipe(sink.str(function (body) {
    t.equal(body, '.a{}.b{}')
    this.push(null)

    A.source = '.aa{}'
    d.bundle().pipe(sink.str(function (src) {
      t.equal(src, '.aa{}.b{}')
      this.push(null)
    }))
  }))
})

