import test from 'tape'
import Depsify from '../lib/main'
import path from 'path'
import sink from 'sink-transform'

var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('custome resolve', function(t) {
  let d = Depsify({
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
  return d.bundle().pipe(sink.str((body, done) => {
    t.equal(body, '.c{}.a{}.b{}')
    done()
  }))
})

test('node-style resolve', function(t) {
  let d = Depsify('./resolve/a.css', {
    basedir: fixtures(),
  })
  return d.bundle().pipe(sink.str((body, done) => {
    t.equal(body.replace(/\s+/g, ''), '.color{}.b{}.a{}')
    done()
  }))
})

