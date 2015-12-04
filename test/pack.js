var test = require('tap').test
var Depsify = require('../')
var sink = require('sink-transform')
var splicer = require('labeled-stream-splicer')

test('pack', function(t) {
  t.plan(1)
  var stream = splicer.obj(Depsify.prototype.pack())
  stream.write({ file: 'a', source: 'a{}', deps: { b: 'b', c: 'c' } })
  stream.write({ file: 'b', source: 'b{}', deps: { c: 'c' } })
  stream.end({ file: 'c', source: 'c{}', deps: {} })
  stream.pipe(sink.str(function (body, done) {
    t.equal(body, 'c{}b{}a{}')
    done()
  }))
})

