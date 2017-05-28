import * as assert from 'assert'
import { removeWhiteSpace } from './util/index'
import JsonToTS from '../src/index'

describe('Array type merging', function () {

  it('should work with arrays with same inner types', function() {
    const json = {
      cats: [
        {name: 'Kittin'},
        {name: 'Sparkles'},
      ]
    }

    const expectedTypes = [
      `interface RootObject {
        cats: Cat[];
      }`,
      `interface Cat {
        name: string;
      }`,
    ].map(removeWhiteSpace)

    const interfaces = JsonToTS(json)

    interfaces
      .forEach( i => {
        const noWhiteSpaceInterface = removeWhiteSpace(i)
        assert(expectedTypes.includes(noWhiteSpaceInterface))
      })

    assert.strictEqual(interfaces.length, 2)
  })

  it('should work with arrays with inner types that has optinal field', function() {
    const json = {
      cats: [
        {name: 'Kittin'},
        {name: 'Sparkles', age: 20},
      ]
    }

    const expectedTypes = [
      `interface RootObject {
        cats: Cat[];
      }`,
      `interface Cat {
        name: string;
        age?: number;
      }`,
    ].map(removeWhiteSpace)

    const interfaces = JsonToTS(json)

    interfaces
      .forEach( i => {
        const noWhiteSpaceInterface = removeWhiteSpace(i)
        assert(expectedTypes.includes(noWhiteSpaceInterface))
      })

    assert.strictEqual(interfaces.length, 2)
  })

  it('should work with arrays with inner types that has no common fields', function() {
    const json = {
      cats: [
        { name: 'Kittin' },
        { age: 20},
      ]
    }

    const expectedTypes = [
      `interface RootObject {
        cats: Cat[];
      }`,
      `interface Cat {
        name?: string;
        age?: number;
      }`,
    ].map(removeWhiteSpace)

    const interfaces = JsonToTS(json)

    interfaces
      .forEach( i => {
        const noWhiteSpaceInterface = removeWhiteSpace(i)
        assert(expectedTypes.includes(noWhiteSpaceInterface))
      })

    assert.strictEqual(interfaces.length, 2)
  })

  it('should work with arrays with inner types that have common field that has different types', function() {
    const json = {
      cats: [
        { age: '20'},
        { age: 20},
      ]
    }

    const expectedTypes = [
      `interface RootObject {
        cats: Cat[];
      }`,
      `interface Cat {
        age: any;
      }`,
    ].map(removeWhiteSpace)

    const interfaces = JsonToTS(json)

    interfaces
      .forEach( i => {
        const noWhiteSpaceInterface = removeWhiteSpace(i)
        assert(expectedTypes.includes(noWhiteSpaceInterface))
      })

    assert.strictEqual(interfaces.length, 2)
  })

  it('should merge different type field withtout array brackets and different type array with array brackets', function() {
    const json = {
      cats: [
        { age: [42]},
        { age: ['42']},
      ],
      dads: [
        'hello', 42
      ]
    }

    const expectedTypes = [
      `interface RootObject {
        cats: Cat[];
        dads: any[];
      }`,
      `interface Cat {
        age: any;
      }`,
    ].map(removeWhiteSpace)

    const interfaces = JsonToTS(json)
    interfaces.forEach(_ => console.log(_))

    interfaces
      .forEach( i => {
        const noWhiteSpaceInterface = removeWhiteSpace(i)
        assert(expectedTypes.includes(noWhiteSpaceInterface))
      })

    assert.strictEqual(interfaces.length, 2)
  })

})