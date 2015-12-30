# depsify
[![version](https://img.shields.io/npm/v/depsify.svg)](https://www.npmjs.org/package/depsify)
[![status](https://travis-ci.org/zoubin/depsify.svg?branch=master)](https://travis-ci.org/zoubin/depsify)
[![coverage](https://img.shields.io/coveralls/zoubin/depsify.svg)](https://coveralls.io/github/zoubin/depsify)
[![dependencies](https://david-dm.org/zoubin/depsify.svg)](https://david-dm.org/zoubin/depsify)
[![devDependencies](https://david-dm.org/zoubin/depsify/dev-status.svg)](https://david-dm.org/zoubin/depsify#info=devDependencies)

Allow css modules to declare their dependencies and pack in custom ways. See [reduce-css](https://github.com/zoubin/reduce-css).

The main ideas are borrowed from [browserify](https://github.com/substack/node-browserify)

## Related

* [reduce-css](https://github.com/zoubin/reduce-css)
* [reduce-css-postcss](https://github.com/zoubin/reduce-css-postcss)

## Example

```javascript
var depsify = require('../')
var path = require('path')
var del = require('del')

var fixtures = path.resolve.bind(path, __dirname)
var DEST = fixtures('build')

del(DEST).then(function () {
  depsify({
    basedir: fixtures('src'),
    entries: ['a.css', 'b.css'],
    processor: [
      require('postcss-import')(),
      require('postcss-url')({ url: 'inline' }),
      require('postcss-advanced-variables')(),
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
* And all options supported by [css-module-deps](https://github.com/zoubin/css-module-deps)

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

