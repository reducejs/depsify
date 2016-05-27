'use strict'

const EventEmitter = require('events')
const MDeps = require('css-module-deps')
const resolve = require('resolve')
const readonly = require('read-only-stream')
const topoSort = require('deps-topo-sort2')
const path = require('path')
const splicer = require('labeled-stream-splicer')
const Transform = require('stream').Transform

class Depsify extends EventEmitter {
  constructor(entries, opts) {
    super()
    opts = opts || {}
    if (typeof entries === 'string' || Array.isArray(entries)) {
      opts = Object.assign({}, opts, {
        entries: [].concat(opts.entries || [], entries),
      })
    } else {
      opts = Object.assign({}, entries, opts)
    }
    this._options = opts
    opts.basedir = opts.basedir || process.cwd()

    this.pipeline = this._createPipeline(opts)

    ;[].concat(opts.transform).filter(Boolean)
      .forEach(p => this.transform(p))

    ;[].concat(opts.processor).filter(Boolean)
      .forEach(p => this.processor(p))

    ;[].concat(opts.entries).filter(Boolean)
      .forEach(file => this.add(file, { basedir: opts.basedir }))

    ;[].concat(opts.plugin).filter(Boolean)
      .forEach(p => this.plugin(p, { basedir: opts.basedir }))
  }

  _createPipeline(opts) {
    this._mdeps = this._createDeps(opts)
    this._mdeps.on('file', file => {
      pipeline.emit('file', file)
      this.emit('file', file)
    })
    this._mdeps.on('package', pkg => {
      pipeline.emit('package', pkg)
      this.emit('package', pkg)
    })
    this._mdeps.on('transform', (tr, file) => {
      pipeline.emit('transform', tr, file)
      this.emit('transform', tr, file)
    })

    // for factor-bundle
    this._bpack = this.pack(opts)

    let pipeline = splicer.obj([
      'record', [ this._recorder() ],
      'deps', [ this._mdeps ],
      'syntax', [],
      'sort', [ this._sort() ],
      'dedupe', [],
      'label', [ this._label() ],
      'emit-deps', [ this._emitDeps() ],
      'debug', [],
      'pack', [ this._bpack ],
      'wrap', [],
    ])

    return pipeline
  }

  _createDeps(opts) {
    return MDeps(Object.assign(
      {}, opts, { transform: [], processor: [] }
    ))
  }

  _emitDeps() {
    let self = this
    return Transform({
      objectMode: true,
      transform: function (row, enc, next) {
        self.emit('dep', row)
        this.push(row)
        next()
      },
    })
  }

  _recorder() {
    let recorded = this._recorded = []
    return Transform({
      objectMode: true,
      transform: function (row, enc, next) {
        recorded.push(row)
        next(null, row)
      },
    })
  }

  _sort() {
    let rows = []
    return Transform({
      objectMode: true,
      transform: function (row, enc, next) {
        rows.push(row)
        next()
      },
      flush: function (next) {
        let ids = []
        let idMap = rows.reduce(function (o, row) {
          let id = row.id || row.file
          o[id] = row
          ids.push(id)
          return o
        }, {})
        ids.sort().forEach((id, index) => {
          idMap[id].index = index + 1
        })
        ids.forEach(id => {
          let row = idMap[id]
          row.indexDeps = Object.keys(row.deps || {}).reduce(function (o, dep) {
            o[dep] = idMap[row.deps[dep]].index
            return o
          }, {})
          this.push(row)
        })
        next()
      },
    })
  }

  _label() {
    var self = this
    return Transform({
      objectMode: true,
      transform: function (row, enc, next) {
        let prev = row.id
        row.id = row.index
        row.deps = row.indexDeps
        self.emit('label', prev, row.id)
        next(null, row)
      },
    })
  }

  pack() {
    let rows = []
    return [
      Transform({
        objectMode: true,
        transform: function (row, enc, next) {
          rows.push(row)
          next()
        },
        flush: function (next) {
          rows.sort(function (a, b) {
            return a.file < b.file ? -1 : 1
          }).forEach(row => {
            this.push(row)
          })
          next()
        },
      }),
      topoSort(),
      Transform({
        objectMode: true,
        transform: function (row, enc, next) {
          next(null, row.source)
        },
      }),
    ]
  }

  add(file, opts) {
    opts = opts || {}
    let basedir = opts.basedir || this._options.basedir
    if (Array.isArray(file)) {
      file.forEach(f => this.add(f, opts))
    } else if (typeof file === 'string') {
      file = path.resolve(basedir, file)
      this.pipeline.write({ file: file })
    } else {
      this.pipeline.write(Object.assign({ basedir: basedir }, file, opts))
    }
    return this
  }

  processor(processor) {
    this.pipeline.write({ processor: processor })
    return this
  }

  transform(tr) {
    this.pipeline.write({ transform: tr })
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
      require(resolve.sync(p, { basedir: basedir }))(this, opts)
    }
    return this
  }

  bundle() {
    if (this._bundled) {
      let recorded = this._recorded
      this.reset()
      recorded.forEach(x => this.pipeline.write(x))
    }
    let output = readonly(this.pipeline)

    this.emit('bundle', output)
    this.pipeline.end()

    this._bundled = true

    return output
  }
}

module.exports = Depsify

