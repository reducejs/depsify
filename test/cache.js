import test from 'tape'
import Depsify from '../lib/main'
import path from 'path'
import sink from 'sink-transform'

var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('cache', function(t) {
  let A = {
    source: '.a{}',
    deps: {},
  }
  let B = {
    source: '.b{}',
    deps: {},
  }
  let d = Depsify({
    basedir: fixtures(),
    resolve: function (file) {
      return Promise.resolve(fixtures(file))
    },
    cache: {
      [fixtures('a.css')]: A,
      [fixtures('b.css')]: B,
    },
  })
  d.add(['./b.css', './a.css'])
  t.task(() => {
    return d.bundle().pipe(sink.str((body, done) => {
      t.equal(body, '.a{}.b{}')
      done()
    }))
  })
  t.task(() => {
    A.source = '.aa{}'
    return d.bundle().pipe(sink.str((body, done) => {
      t.equal(body, '.aa{}.b{}')
      done()
    }))
  })
})

