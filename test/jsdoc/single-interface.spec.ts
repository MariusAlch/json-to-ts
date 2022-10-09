import * as assert from "assert";
import { removeWhiteSpace, JsonToJSDoc } from "../util/index";

// seem jsdoc of vscode not support property with space, like `hello world`
// so it was removed from the test case

describe("[JSDoc] Single interface", function () {
  it("should work with empty objects", function () {
    const json = {};

    const expected = `
      /**
       * @typedef {object} RootObject 
       */
    `;
    const actual = JsonToJSDoc(json).pop();
    const [a, b] = [expected, actual].map(removeWhiteSpace);
    assert.strictEqual(a, b);
  });

  it("should not quote underscore key names", function () {
    const json = {
      _marius: "marius",
    };

    const expected = `
      /**
       * @typedef {object} RootObject
       * @property {string} _marius
       */
    `;
    const actual = JsonToJSDoc(json).pop();
    const [a, b] = [expected, actual].map(removeWhiteSpace);
    assert.strictEqual(a, b);
  });

  it("should convert Date to Date type", function () {
    const json = {
      _marius: new Date(),
    };

    const expected = `
      /**
       * @typedef {object} RootObject
       * @property {Date} _marius
       */
    `;
    const actual = JsonToJSDoc(json).pop();
    const [a, b] = [expected, actual].map(removeWhiteSpace);
    assert.strictEqual(a, b);
  });

  it("should work with primitive types", function () {
    const json = {
      str: "this is string",
      num: 42,
      bool: true,
    };

    const expected = `
      /** 
       * @typedef {object} RootObject
       * @property {string} str
       * @property {number} num
       * @property {boolean} bool
       */
    `;
    const interfaceStr = JsonToJSDoc(json).pop();
    const [expect, actual] = [expected, interfaceStr].map(removeWhiteSpace);
    assert.strictEqual(expect, actual);
  });

  it("should keep field order", function () {
    const json = {
      c: "this is string",
      a: 42,
      b: true,
    };

    const expected = `
      /**
       * @typedef {object} RootObject
       * @property {string} c
       * @property {number} a
       * @property {boolean} b
       */
    `;
    const interfaceStr = JsonToJSDoc(json).pop();
    const [expect, actual] = [expected, interfaceStr].map(removeWhiteSpace);
    assert.strictEqual(expect, actual);
  });

  it("should add optional field modifier on null values", function () {
    const json = {
      field: null,
    };

    const expected = `
      /**
       * @typedef {object} RootObject
       * @property {any} [field]
       */
    `;
    const actual = JsonToJSDoc(json).pop();
    const [a, b] = [expected, actual].map(removeWhiteSpace);
    assert.strictEqual(a, b);
  });

  it('should name root object interface "RootObject"', function () {
    const json = {};

    const expected = `
      /**
       * @typedef {object} RootObject
       */
    `;
    const actual = JsonToJSDoc(json).pop();
    const [a, b] = [expected, actual].map(removeWhiteSpace);
    assert.strictEqual(a, b);
  });

  it("should empty array should be any[]", function () {
    const json = {
      arr: [],
    };

    const expected = `
      /**
       * @typedef {object} RootObject
       * @property {any[]} arr
       */
    `;
    const actual = JsonToJSDoc(json).pop();
    const [a, b] = [expected, actual].map(removeWhiteSpace);
    assert.strictEqual(a, b);
  });
});
