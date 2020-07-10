
import { Argument, Arg } from '@fluffy-spoon/substitute/dist/src/Arguments'
import deepEqual from 'deep-equal';

Arg.deepEquals = <T>(expected: T): Argument<T> & T => {
  return new Argument<T>(`deeply equal to ${JSON.stringify(expected)}`, (x: T): boolean => deepEqual(x, expected)) as Argument<T> & T
}

import mongoose, { Document } from 'mongoose'

const DELETE_KEY = Symbol('DELETE_KEY')
export function transformObject<T>(x: any, transform: any, target: any = {}): T {
  const out = Object.assign(target || {}, x)
  for (const key of Object.keys(transform)) {
    if (transform[key] === DELETE_KEY) {
      delete out[key]
    }
    else if (typeof transform[key] === 'function') {
      out[key] = transform[key](x[key])
    }
    else {
      out[key] = transform[key]
    }
  }
  return out as T
}
transformObject.DELETE_KEY = DELETE_KEY


/**
 * Create a (fake) persisted Mongoose document from the given value object.
 * If the value object has an `id` entry, that entry's value will become the
 * `_id` entry's value in the resulting entity object.  Otherwise, the created
 * entity will have an `_id` entry with a generated Mongo Object ID.
 *
 * @param m the Mongoose `Model` constructor
 * @param x the value object
 */
export function parseEntity<V extends any, D extends Document>(m: {new(x: V): D}, x: V): D {
  const persisted: any = Object.assign({}, x)
  let id = x.id
  delete persisted.id
  if (typeof id === 'string') {
    try {
      id = mongoose.Types.ObjectId(id)
    }
    catch (e) {
      // ¯\_(ツ)_/¯
    }
  }
  if (!id) {
    id = mongoose.Types.ObjectId()
  }
  persisted._id = id
  return new m(persisted)
}