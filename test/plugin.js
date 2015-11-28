var test = require('tap').test
var Depsify = require('../')
var path = require('path')
var sink = require('sink-transform')
var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('plugin', function(t) {
  t.plan(1)
  var A = {
    file: './a.css',
    source: '@deps "./c.css";.a{}',
  }
  var B = {
    file: './b.css',
    source: '@deps "./c.css";.b{}',
  }
  var C = {
    file: './c.css',
    source: '.c{}',
  }
  var cache = {}
  cache[fixtures('a.css')] = A
  cache[fixtures('b.css')] = B
  cache[fixtures('c.css')] = C
  var d = Depsify({
    basedir: fixtures(),
    entries: [A.file, B.file, C.file],
    resolve: function (file) {
      return Promise.resolve(fixtures(file))
    },
    readFile: function (file) {
      return Promise.resolve(cache[file].source)
    },
  })
  d.plugin('factor-vinylify', {
    basedir: fixtures(),
    entries: [A.file, B.file],
    common: 'common.css',
  })
  d.on('factor.pipeline', function (file, pipeline) {
    var labeled = pipeline.get('pack')
    labeled.splice(labeled.length - 1, 1, d.pack())
  })

  var expected = [{}, {}, {}]
  expected[0][fixtures('a.css')] = '.a{}'
  expected[1][fixtures('b.css')] = '.b{}'
  expected[2][fixtures('common.css')] = '.c{}'

  d.bundle().pipe(sink.obj(function (files) {
    t.same(
      files.sort(function (a, b) {
        return a.path < b.path ? -1 : 1
      })
      .map(function (file) {
        var ret = {}
        ret[file.path] = file.contents.toString('utf8')
        return ret
      }),
      expected
    )
    this.push(null)
  }))
})

