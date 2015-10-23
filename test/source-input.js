import test from 'tape'
import Depsify from '../lib/main'
import path from 'path'
import sink from 'sink-transform'

var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('source input', function(t) {
  let d = Depsify({
    basedir: fixtures(),
  })
  d.add([
    {
      file: './a.css',
      source: '.a{}',
    },
    {
      file: './b.css',
      source: '.b{}',
    },
  ])
  return d.bundle().pipe(sink.str((body, done) => {
    t.equal(body, '.a{}.b{}')
    done()
  }))
})

