# depsify
Allow css modules to declare their dependencies and pack in custom ways. See [reduce-css](https://github.com/zoubin/reduce-css).

[![version](https://img.shields.io/npm/v/depsify.svg)](https://www.npmjs.org/package/depsify)
[![status](https://travis-ci.org/zoubin/depsify.svg?branch=master)](https://travis-ci.org/zoubin/depsify)
[![coverage](https://img.shields.io/coveralls/zoubin/depsify.svg)](https://coveralls.io/github/zoubin/depsify)
[![dependencies](https://david-dm.org/zoubin/depsify.svg)](https://david-dm.org/zoubin/depsify)
[![devDependencies](https://david-dm.org/zoubin/depsify/dev-status.svg)](https://david-dm.org/zoubin/depsify#info=devDependencies)

The main ideas are borrowed from [browserify](https://github.com/substack/node-browserify)

## Related

* [reduce-css](https://github.com/zoubin/reduce-css)

## Example

```javascript
import gulp from 'gulp'
import depsify from '../lib/main'
import path from 'path'
import del from 'del'
import postcss from 'postcss'
import url from 'postcss-url'
import source from 'vinyl-source-stream'

var processor = postcss([
  require('postcss-import')(),
  require('postcss-url')({ url: 'copy', assetsPath: 'i' }),
  require('postcss-advanced-variables')(),
])

var fixtures = path.resolve.bind(path, __dirname, 'src')
var DEST = path.join(__dirname, 'build')
var common = path.join(DEST, 'common.css')

gulp.task('clean', function () {
  return del(DEST)
})

gulp.task('default', ['clean'], function () {
  return depsify({
    basedir: fixtures(),
    entries: ['a.css', 'b.css'],
    processor: function (result) {
      return processor.process(result.css, {
        from: result.from,
        to: common,
      })
      .then(function (res) {
        result.css = res.css
      })
    },
  })
  .bundle()
  .pipe(source('common.css'))
  .pipe(gulp.dest(DEST))
})

```

## API

### Options

#### basedir

#### entries

#### plugin

#### __More__
See [css-module-deps](https://github.com/zoubin/css-module-deps)

### Methods

#### add(file, opts)

#### processor(p)

#### plugin(p, opts)

#### bundle()

#### reset()

