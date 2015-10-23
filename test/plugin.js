import test from 'tape'
import Depsify from '../lib/main'
import path from 'path'
import sink from 'sink-transform'

var fixtures = path.resolve.bind(path, __dirname, 'fixtures')

test('plugin', function(t) {
  let A = {
    file: './a.css',
    source: '@deps "./c.css";.a{}',
  }
  let B = {
    file: './b.css',
    source: '@deps "./c.css";.b{}',
  }
  let C = {
    file: './c.css',
    source: '.c{}',
  }
  let cache = {
    [fixtures('a.css')]: A,
    [fixtures('b.css')]: B,
    [fixtures('c.css')]: C,
  }
  let d = Depsify({
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
  d.on('factor.pipeline', (file, pipeline) => {
    let labeled = pipeline.get('pack')
    labeled.splice(labeled.length - 1, 1, d.pack())
  })

  return d.bundle().pipe(sink.obj((files, done) => {
    t.same(
      files.sort(function (a, b) {
        return a.path < b.path ? -1 : 1
      })
      .map(function (file) {
        return {
          [file.path]: file.contents.toString('utf8'),
        }
      }),
      [
        { [fixtures('a.css')]: '.a{}' },
        { [fixtures('b.css')]: '.b{}' },
        { [fixtures('common.css')]: '.c{}' },
      ]
    )
    done()
  }))
})

