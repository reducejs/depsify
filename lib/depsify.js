import EventEmitter from 'events'
import mix from 'util-mix'
import MDeps from 'css-module-deps'
import thr from 'through2'
import resolve from 'resolve'
import readonly from 'read-only-stream'
import topoSort from 'deps-topo-sort'
import path from 'path'
import splicer from 'labeled-stream-splicer'
import sink from 'sink-transform'

export default class Depsify extends EventEmitter {
  constructor(entries, opts) {
    super()
    if (
      typeof entries === 'string' ||
      Array.isArray(entries)
    ) {
      opts = mix({}, opts, {
        entries: [].concat(opts.entries || [], entries),
      })
    } else {
      opts = mix({}, entries, opts)
    }
    this._options = opts
    opts.basedir = opts.basedir || process.cwd()

    this.pipeline = this._createPipeline(opts)

    ;[].concat(opts.entries).filter(Boolean).forEach((file) => {
      this.add(file, { basedir: opts.basedir })
    })
    ;[].concat(opts.plugin).filter(Boolean).forEach((p) => {
      this.plugin(p, { basedir: opts.basedir })
    })
  }
  _createPipeline(opts) {
    this._mdeps = new MDeps(mix({}, opts))
    this._mdeps.on('file', (file) => {
      pipeline.emit('file', file)
      this.emit('file', file)
    })
    this._mdeps.on('package', (pkg) => {
      pipeline.emit('package', pkg)
      this.emit('package', pkg)
    })
    this._mdeps.on('transform', (tr, file) => {
      pipeline.emit('transform', tr, file)
      this.emit('transform', tr, file)
    })

    if (opts.pack) {
      this.pack = opts.pack
    }
    // for factor-bundle
    this._bpack = this.pack(opts)

    var pipeline = splicer.obj([
      'record', [ this._recorder() ],
      'deps', [ this._mdeps ],
      'unbom', [ this._unbom() ],
      'syntax', [],
      'sort', [],
      'dedupe', [],
      'label', [],
      'emit-deps', [ this._emitDeps() ],
      'debug', [],
      'pack', [ this._bpack ],
      'wrap', [],
    ])

    return pipeline
  }
  _unbom() {
    return thr.obj(function (row, enc, next) {
      if (/^\ufeff/.test(row.source)) {
        row.source = row.source.replace(/^\ufeff/, '')
      }
      this.push(row)
      next()
    })
  }
  _emitDeps() {
    let self = this
    return thr.obj(function (row, enc, next) {
      self.emit('dep', row)
      this.push(row)
      next()
    })
  }
  _recorder() {
    this._recorded = []
    return thr.obj((row, _, next) => {
      this._recorded.push(row)
      next(null, row)
    })
  }
  pack() {
    return [
      sink.obj(function (rows, done) {
        rows.sort((a, b) => {
          return a.file < b.file ? -1 : 1
        })
        .forEach((row) => {
          // to use toposort
          row.id = row.file
          this.push(row)
        })
        done()
      }),
      topoSort(),
      thr.obj((row, _, next) => {
        next(null, row.source)
      }),
    ]
  }
  add(file, opts) {
    opts = opts || {}
    if (Array.isArray(file)) {
      file.forEach((f) => {
        this.add(f, opts)
      })
    } else if (typeof file === 'string') {
      file = path.resolve(opts.basedir || this._options.basedir, file)
      this.pipeline.write({ file: file })
    } else {
      this.pipeline.write(mix({ basedir: this._options.basedir }, file, opts))
    }
    return this
  }
  reset() {
    this.pipeline = this._createPipeline(this._options)
    this._bundled = false
    this.emit('reset')
  }
  plugin(p, opts) {
    if (Array.isArray(p)) {
      opts = p[1]
      p = p[0]
    }
    let basedir = opts && opts.basedir || this._options.basedir
    if (typeof p === 'function') {
      p(this, opts)
    } else {
      let pfile = resolve.sync(p, { basedir: basedir })
      let f = require(pfile)
      f(this, opts)
    }
    return this
  }
  bundle() {
    if (this._bundled) {
      let recorded = this._recorded
      this.reset()
      recorded.forEach((x) => {
        this.pipeline.write(x)
      })
    }
    let output = readonly(this.pipeline)
    this.emit('bundle', output)
    this.pipeline.end()
    this._bundled = true

    return output
  }
}

