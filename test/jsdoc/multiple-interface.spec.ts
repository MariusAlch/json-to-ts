import * as assert from "assert";
import { removeWhiteSpace, JsonToJSDoc } from "../util/index";

// special chars as property are ignored by typescript
// so these cases are also removed

describe("[JSDoc] Multiple interfaces", function() {
  it("should create separate interface for nested objects", function() {
    const json = {
      a: {
        b: 42
      }
    };

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property {A} a
        */`,
      `/**
        * @typedef {object} A
        * @property {number} b
        */`
    ].map(removeWhiteSpace);

    JsonToJSDoc(json).forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should not create duplicate on same type object fields", function() {
    const json = {
      a: {
        b: 42
      },
      c: {
        b: 24
      }
    };

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property {A} a
        * @property {A} c
        */`,
      `/**
        * @typedef {object} A 
        * @property {number} b
        */`
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);
    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });

    assert(interfaces.length === 2);
  });

  it("should have unique names for nested objects since they ", function() {
    const json = {
      name: "Larry",
      parent: {
        name: "Garry",
        parent: {
          name: "Marry",
          parent: null
        }
      }
    };

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property {string} name
        * @property {Parent2} parent
        */`,
      `/**
        * @typedef {object} Parent
        * @property {string} name
        * @property {any} [parent]
        */`,
      `/**
        * @typedef {object} Parent2
        * @property {string} name
        * @property {Parent} parent
        */`
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);
    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should support multi nested arrays", function() {
    const json = {
      cats: [
        [{ name: "Kittin" }, { name: "Kittin" }, { name: "Kittin" }],
        [{ name: "Kittin" }, { name: "Kittin" }, { name: "Kittin" }]
      ]
    };

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property {Cat[][]} cats
        */`,
      `/**
        * @typedef {object} Cat
        * @property {string} name
        */`
    ].map(removeWhiteSpace);

    JsonToJSDoc(json).forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should singularize array types (dogs: [...] => dogs: Dog[] )", function() {
    const json = {
      dogs: [{ name: "sparky" }, { name: "goodboi" }]
    };

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property {Dog[]} dogs
        */`,
      `/**
        * @typedef {object} Dog
        * @property {string} name
        */`
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);
    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should not singularize if not array type (dogs: {} => dogs: Dogs )", function() {
    const json = {
      cats: {
        popularity: "very popular"
      }
    };

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property {Cats} cats
        */`,
      `/**
        * @typedef {object} Cats
        * @property {string} popularity
        */`
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);
    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should capitalize interface names", function() {
    const json = {
      cat: {}
    };

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject 
        * @property {Cat} cat
        */`,
      `/**
        * @typedef {object} Cat
        */`
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);
    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should start unique names increment with 2", function() {
    const json = {
      a: {
        human: { legs: 4 }
      },
      b: {
        human: { arms: 2 }
      }
    };

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property {A} a
        * @property {B} b
        */`,
      `/**
        * @typedef {object} A
        * @property {Human} human
        */`,
      `/**
        * @typedef {object} B
        * @property {Human2} human
        */`,
      `/**
        * @typedef {object} Human
        * @property {number} legs
        */`,
      `/**
        * @typedef {object} Human2
        * @property {number} arms
        */`
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);
    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });
});
