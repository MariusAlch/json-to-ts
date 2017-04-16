import * as assert from 'assert'
import { removeWhiteSpace } from './util/index'
import { jsonToTypescriptInterfaces } from '../src/index'

describe('Single interface', function () {

  it('should work with empty objects', function() {
    const json = {}

    const expected = `
      interface RootObject {
      }
    `
    const actual = jsonToTypescriptInterfaces(json).pop()
    const [a, b] = [expected, actual].map(removeWhiteSpace)
    assert.strictEqual(a, b)
  })

  it('should work with primitive types', function() {
    const json = {
      str: 'this is string',
      num: 42,
      bool: true,
    }

    const expected = `
      interface RootObject {
        str: string;
        num: number;
        bool: boolean;
      }
    `
    const interfaceStr = jsonToTypescriptInterfaces(json).pop()
    const [expect, actual] = [expected, interfaceStr].map(removeWhiteSpace)
    assert.strictEqual(expect, actual)
  })

  it('should keep field order', function() {
    const json = {
      c: 'this is string',
      a: 42,
      b: true,
    }

    const expected = `
      interface RootObject {
        c: string;
        a: number;
        b: boolean;
      }
    `
    const interfaceStr = jsonToTypescriptInterfaces(json).pop()
    const [expect, actual] = [expected, interfaceStr].map(removeWhiteSpace)
    assert.strictEqual(expect, actual)
  })

  it('should add optional field modifier on null values', function() {
    const json = {
      field: null
    }

    const expected = `
      interface RootObject {
        field?: any;
      }
    `
    const actual = jsonToTypescriptInterfaces(json).pop()
    const [a, b] = [expected, actual].map(removeWhiteSpace)
    assert.strictEqual(a, b)
  })

  it('should name root object interface "RootObject"', function() {
    const json = {
    }

    const expected = `
      interface RootObject {
      }
    `
    const actual = jsonToTypescriptInterfaces(json).pop()
    const [a, b] = [expected, actual].map(removeWhiteSpace)
    assert.strictEqual(a, b)
  })

})