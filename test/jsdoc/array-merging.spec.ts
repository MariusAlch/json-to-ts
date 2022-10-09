import * as assert from "assert";
import { removeWhiteSpace, JsonToJSDoc } from "../util/index";

describe("[JSDoc] Array type merging", function() {
  it("should work with arrays with same inner types", function() {
    const json = {
      cats: [{ name: "Kittin" }, { name: "Sparkles" }]
    };

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property {Cat[]} cats
        */
      `,
      `/**
        * @typedef {object} Cat
        * @property {string} name
        */
      `
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);

    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });

    assert.strictEqual(interfaces.length, 2);
  });

  it("union null type should be emited and field should be marked as optional", function() {
    const json = [{ age: 42 }, { age: null }];

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject 
        * @property {number} [age]
        */`
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);

    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });

    assert.strictEqual(interfaces.length, 1);
  });

  it("null should stay if it is part of array elements", function() {
    const json = {
      arr: [42, "42", null]
    };

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property {(null | number | string)[]} arr
        */
      `
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);

    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });

    assert.strictEqual(interfaces.length, 1);
  });

  it("array types should be merge even if they are nullable", function() {
    const json = [
      {
        field: ["string"]
      },
      {
        field: [42]
      },
      {
        field: null
      },
      {
        field: [new Date()]
      }
    ];

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property {(Date | number | string )[]} [field]
        */`
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);

    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });

    assert.strictEqual(interfaces.length, 1);
  });

  it("object types should be merge even if they are nullable", function() {
    const json = [
      {
        field: { tag: "world" }
      },
      {
        field: { tag: 42 }
      },
      {
        field: null
      }
    ];

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property {Field} [field]
        */`,
      `/**
        * @typedef {object} Field
        * @property {number | string} tag
        */`
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);
    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });

    assert.strictEqual(interfaces.length, 2);
  });

  it("should work with arrays with inner types that has optinal field", function() {
    const json = {
      cats: [{ name: "Kittin" }, { name: "Sparkles", age: 20 }]
    };

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property {Cat[]} cats
        */`,
      `/**
        * @typedef {object} Cat
        * @property {string} name
        * @property {number} [age]
        */`
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);

    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });

    assert.strictEqual(interfaces.length, 2);
  });

  it("should work with arrays with inner types that has no common fields", function() {
    const json = {
      cats: [{ name: "Kittin" }, { age: 20 }]
    };

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject 
        * @property {Cat[]} cats
        */`,
      `/**
        * @typedef {object} Cat 
        * @property {string} [name]
        * @property {number} [age]
        */
      `
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);

    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });

    assert.strictEqual(interfaces.length, 2);
  });

  it("should work with arrays with inner types that have common field that has different types", function() {
    const json = {
      cats: [{ age: "20" }, { age: 20 }]
    };

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property {Cat[]} cats
        */`,
      `/**
        * @typedef {object} Cat
        * @property {number | string} age
        */`
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);

    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });

    assert.strictEqual(interfaces.length, 2);
  });

  it("should solve edge case 1", function() {
    const json = {
      cats: [{ age: [42] }, { age: ["42"] }],
      dads: ["hello", 42]
    };

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property { Cat[]} cats
        * @property {(number | string)[]} dads
        */`,
      `/**
        * @typedef {object} Cat
        * @property {(number | string)[]} age 
        */`
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);

    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });

    assert.strictEqual(interfaces.length, 2);
  });

  it("should solve edge case 2", function() {
    const json = {
      items: [
        {
          billables: [
            {
              quantity: 2,
              price: 0
            }
          ]
        },
        {
          billables: [
            {
              priceCategory: {
                title: "Adult",
                minAge: 0,
                maxAge: 99
              },
              quantity: 2,
              price: 226
            }
          ]
        }
      ]
    };

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property {Item[]} items
        */`,
      `/**
        * @typedef {object} Item 
        * @property {Billable[]} billables
        */`,
      `/**
        * @typedef {object} Billable 
        * @property {number} quantity
        * @property {number} price
        * @property {PriceCategory} [priceCategory]
        */`,
      `/**
        * @typedef {object} PriceCategory 
        * @property {string} title
        * @property {number} minAge
        * @property {number} maxAge
        */`
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);

    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });

    assert.strictEqual(interfaces.length, 4);
  });

  it("should solve edge case 3", function() {
    const json = [
      {
        nestedElements: [
          {
            commonField: 42,
            optionalField: "field"
          },
          {
            commonField: 42,
            optionalField3: "field3"
          }
        ]
      },
      {
        nestedElements: [
          {
            commonField: "42",
            optionalField2: "field2"
          }
        ]
      }
    ];

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property {NestedElement[]} nestedElements
        */`,
      `/**
        * @typedef {object} NestedElement
        * @property {number | string} commonField
        * @property {string} [optionalField]
        * @property {string} [optionalField3]
        * @property {string} [optionalField2]
        */`
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);

    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });

    assert.strictEqual(interfaces.length, 2);
  });

  it("should merge empty array with primitive types", function() {
    const json = [
      {
        nestedElements: []
      },
      {
        nestedElements: ["kittin"]
      }
    ];

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property {string[]} nestedElements
        */`
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);

    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });

    assert.strictEqual(interfaces.length, 1);
  });

  it("should merge empty array with object types", function() {
    const json = [
      {
        nestedElements: []
      },
      {
        nestedElements: [{ name: "kittin" }]
      }
    ];

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property {NestedElement[]} nestedElements
        */`,
      `/**
        * @typedef {object} NestedElement
        * @property {string} name
        */`
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);

    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });

    assert.strictEqual(interfaces.length, 2);
  });

  it("should merge empty array with array types", function() {
    const json = [
      {
        nestedElements: []
      },
      {
        nestedElements: [["string"]]
      }
    ];

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property {string[][]} nestedElements
        */`
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);

    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });

    assert.strictEqual(interfaces.length, 1);
  });

  it("should merge union types with readable names ", function() {
    const json = [
      {
        marius: "marius"
      },
      {
        marius: [42]
      }
    ];

    const expectedTypes = [
      `/**
        * @typedef {object} RootObject
        * @property  {number[] | string} marius
        */`
    ].map(removeWhiteSpace);

    const interfaces = JsonToJSDoc(json);

    interfaces.forEach(i => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });

    assert.strictEqual(interfaces.length, 1);
  });
});
