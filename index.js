var EventEmitter = require('events')
var mix = require('mixy')
var MDeps = require('css-module-deps')
var thr = require('through2')
var resolve = require('resolve')
var readonly = require('read-only-stream')
var topoSort = require('deps-topo-sort')
var path = require('path')
var splicer = require('labeled-stream-splicer')
var sink = require('sink-transform')

var inherits = require('util').inherits
inherits(Depsify, EventEmitter)

module.exports = Depsify

function Depsify(entries, opts) {
  if (!(this instanceof Depsify)) {
    return new Depsify(entries, opts)
  }
  if (typeof entries === 'string' || Array.isArray(entries)) {
    opts = mix({}, opts, {
      entries: [].concat(opts.entries || [], entries),
    })
  } else {
    opts = mix({}, entries, opts)
  }
  this._options = opts
  opts.basedir = opts.basedir || process.cwd()

  this.pipeline = this._createPipeline(opts)

  ;[].concat(opts.transform).filter(Boolean).forEach(function (p) {
    this.transform(p)
  }, this)
  ;[].concat(opts.entries).filter(Boolean).forEach(function (file) {
    this.add(file, { basedir: opts.basedir })
  }, this)
  ;[].concat(opts.plugin).filter(Boolean).forEach(function (p) {
    this.plugin(p, { basedir: opts.basedir })
  }, this)
}

Depsify.prototype._createPipeline = function (opts) {
  var self = this
  this._mdeps = this._createDeps(opts)
  this._mdeps.on('file', function (file) {
    pipeline.emit('file', file)
    self.emit('file', file)
  })
  this._mdeps.on('package', function (pkg) {
    pipeline.emit('package', pkg)
    self.emit('package', pkg)
  })
  this._mdeps.on('transform', function (tr, file) {
    pipeline.emit('transform', tr, file)
    self.emit('transform', tr, file)
  })

  // for factor-bundle
  this._bpack = this.pack(opts)

  var pipeline = splicer.obj([
    'record', [ this._recorder() ],
    'deps', [ this._mdeps ],
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

Depsify.prototype._createDeps = function(opts) {
  opts = mix.fill({ transform: [] }, opts)
  return MDeps(opts)
}

Depsify.prototype._emitDeps = function() {
  var self = this
  return thr.obj(function (row, enc, next) {
    self.emit('dep', row)
    this.push(row)
    next()
  })
}

Depsify.prototype._recorder = function() {
  var recorded = this._recorded = []
  return thr.obj(function (row, _, next) {
    recorded.push(row)
    next(null, row)
  })
}

Depsify.prototype.pack = function() {
  return [
    sink.obj(function (rows, done) {
      rows.sort(function (a, b) {
        return a.file < b.file ? -1 : 1
      })
      .forEach(function (row) {
        // to use toposort
        row.id = row.file
        this.push(row)
      }, this)
      done()
    }),
    topoSort(),
    thr.obj(function (row, _, next) {
      next(null, row.source)
    }),
  ]
}

Depsify.prototype.add = function(file, opts) {
  opts = opts || {}
  var basedir = opts.basedir || this._options.basedir
  if (Array.isArray(file)) {
    file.forEach(function (f) {
      this.add(f, opts)
    }, this)
  } else if (typeof file === 'string') {
    file = path.resolve(basedir, file)
    this.pipeline.write({ file: file })
  } else {
    this.pipeline.write(mix({ basedir: basedir }, file, opts))
  }
  return this
}

Depsify.prototype.processor = function(processor) {
  this.pipeline.write({ processor: processor })
  return this
}

Depsify.prototype.transform = function(tr) {
  this.pipeline.write({ transform: tr })
  return this
}

Depsify.prototype.reset = function() {
  this.pipeline = this._createPipeline(this._options)
  this._bundled = false
  this.emit('reset')
}

Depsify.prototype.plugin = function(p, opts) {
  if (Array.isArray(p)) {
    opts = p[1]
    p = p[0]
  }
  var basedir = opts && opts.basedir || this._options.basedir
  if (typeof p === 'function') {
    p(this, opts)
  } else {
    var pfile = resolve.sync(p, { basedir: basedir })
    var f = require(pfile)
    f(this, opts)
  }
  return this
}

Depsify.prototype.bundle = function() {
  if (this._bundled) {
    var recorded = this._recorded
    this.reset()
    recorded.forEach(function (x) {
      this.pipeline.write(x)
    }, this)
  }
  var output = readonly(this.pipeline)

  this.emit('bundle', output)
  this.pipeline.end()

  this._bundled = true

  return output
}

