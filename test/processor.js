var test = require('tap').test
var Depsify = require('../')
var path = require('path')
var sink = require('sink-transform')
var fixtures = path.resolve.bind(path, __dirname, 'fixtures')
var fs = require('fs')

var atImport = require('postcss-simple-import')
var vars = require('postcss-advanced-variables')

var expected = fs.readFileSync(fixtures('processor', 'expected.css'), 'utf8')

test('api', function(t) {
  t.plan(1)
  var b = Depsify({
    basedir: fixtures('processor'),
    atRuleName: 'external',
    entries: ['./b.css', './a.css'],
  })
  b.processor(atImport())
  b.processor(vars())
  b.bundle().pipe(sink.str(function (body) {
    t.equal(body, expected)
    this.push(null)
  }))
})

test('option', function(t) {
  t.plan(1)
  var b = Depsify({
    basedir: fixtures('processor'),
    atRuleName: 'external',
    processor: [atImport(), vars()],
    entries: ['./b.css', './a.css'],
  })
  b.bundle().pipe(sink.str(function (body) {
    t.equal(body, expected)
    this.push(null)
  }))
})

