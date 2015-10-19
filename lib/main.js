import Depsify from './depsify'

export default function depsify(entries, opts) {
  return new Depsify(entries, opts)
}
