import test from 'tape'
import Depsify from '../lib/main'
import path from 'path'
import sink from 'sink-transform'

var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('processor', function(t) {
  let d = Depsify({
    basedir: fixtures(),
    resolve: function (file) {
      return Promise.resolve(fixtures(file))
    },
    readFile: (file) => {
      return Promise.resolve(path.basename(file, '.css') + '{}')
    },
  })
  d.add(['./b.css', './a.css'])
  d.processor([prefixer, 'x-'])
  return d.bundle().pipe(sink.str((body, done) => {
    t.equal(body, 'x-a{}x-b{}')
    done()
  }))
})

function prefixer(result, prefix) {
  let css = result.css
  css = prefix + css.replace(/\s+/, '')
  result.css = css
}

