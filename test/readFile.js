import test from 'tape'
import Depsify from '../lib/main'
import path from 'path'
import sink from 'sink-transform'

var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('readFile', function(t) {
  let A = {
    source: 'aa{}',
    deps: {},
  }
  let B = {
    source: 'bb{}',
    deps: {},
  }
  let cache = {
    [fixtures('a.css')]: A,
    [fixtures('b.css')]: B,
  }
  let d = Depsify({
    basedir: fixtures(),
    resolve: (file) => {
      return Promise.resolve(fixtures(file))
    },
    readFile: (file) => {
      return Promise.resolve(path.basename(file, '.css') + '{}')
    },
    cache: cache,
  })
  d.add(['./b.css', './a.css'])
  t.task(() => {
    return d.bundle().pipe(sink.str((body, done) => {
      t.equal(body, 'aa{}bb{}')
      done()
    }))
  })
  t.task(() => {
    delete cache[fixtures('a.css')]
    return d.bundle().pipe(sink.str((body, done) => {
      t.equal(body, 'a{}bb{}')
      done()
    }))
  })
})

