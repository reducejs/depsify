# depsify
[![version](https://img.shields.io/npm/v/depsify.svg)](https://www.npmjs.org/package/depsify)
[![status](https://travis-ci.org/reducejs/depsify.svg?branch=master)](https://travis-ci.org/reducejs/depsify)
[![coverage](https://img.shields.io/coveralls/reducejs/depsify.svg)](https://coveralls.io/github/reducejs/depsify)
[![dependencies](https://david-dm.org/reducejs/depsify.svg)](https://david-dm.org/reducejs/depsify)
[![devDependencies](https://david-dm.org/reducejs/depsify/dev-status.svg)](https://david-dm.org/reducejs/depsify#info=devDependencies)
![node](https://img.shields.io/node/v/depsify.svg)

Allow css modules to declare their dependencies and pack in custom ways. See [reduce-css](https://github.com/reducejs/reduce-css).

The main ideas are borrowed from [browserify](https://github.com/substack/node-browserify)

## Related

* [reduce-css](https://github.com/reducejs/reduce-css)
* [reduce-css-postcss](https://github.com/reducejs/reduce-css-postcss)

## Example

```javascript
var depsify = require('../')
var path = require('path')
var del = require('del')

var fixtures = path.resolve.bind(path, __dirname)
var DEST = fixtures('build')

var atImport = require('postcss-simple-import')
var url = require('postcss-custom-url')
var vars = require('postcss-advanced-variables')

del(DEST).then(function () {
  depsify({
    basedir: fixtures('src'),
    entries: ['a.css', 'b.css'],
    processor: [
      atImport(),
      url(url.util.inline),
      vars(),
    ],
  })
  .bundle()
  .pipe(process.stdout)
})

```

## var b = Depsify(entries, options)

### Options

* `basedir`
* `entries`
* `plugin`
* `transform`
* `processor`
* And all options supported by [css-module-deps](https://github.com/reducejs/css-module-deps)

### Methods

* `add(file, opts)`
* `plugin(p, opts)`
* `transform(tr)`
* `processor(p)`
* `bundle()`

### Events

* `file`
* `transform`
* `dep`
* `reset`
* `bundle`

