import * as assert from "assert";
import { removeWhiteSpace } from "./util/index";
import JsonToTS from "../src/index";

describe("Multiple interfaces", function () {
  it("should create separate interface for nested objects", function () {
    const json = {
      a: {
        b: 42,
      },
    };

    const expectedTypes = [
      `interface RootObject {
        a: A;
      }`,
      `interface A {
        b: number;
      }`,
    ].map(removeWhiteSpace);

    JsonToTS(json).forEach((i) => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should not create duplicate on same type object fields", function () {
    const json = {
      a: {
        b: 42,
      },
      c: {
        b: 24,
      },
    };

    const expectedTypes = [
      `interface RootObject {
        a: A;
        c: A;
      }`,
      `interface A {
        b: number;
      }`,
    ].map(removeWhiteSpace);

    const interfaces = JsonToTS(json);
    interfaces.forEach((i) => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });

    assert(interfaces.length === 2);
  });

  it("should have multi keyword interfaces created without space", function () {
    const json = {
      "hello world": {
        b: 42,
      },
    };

    const expectedTypes = [
      `interface RootObject {
  'hello world': HelloWorld;
}`,
      `interface HelloWorld {
  b: number;
}`,
    ].map((_) => _.trim());

    const interfaces = JsonToTS(json);
    interfaces.forEach((typeInterface) => {
      assert(expectedTypes.includes(typeInterface));
    });
  });

  it("should have unique names for nested objects since they ", function () {
    const json = {
      name: "Larry",
      parent: {
        name: "Garry",
        parent: {
          name: "Marry",
          parent: undefined,
        },
      },
    };

    const expectedTypes = [
      `interface RootObject {
        name: string;
        parent: Parent2;
      }`,
      `interface Parent {
        name: string;
        parent?: any;
      }`,
      `interface Parent2 {
        name: string;
        parent: Parent;
      }`,
    ].map(removeWhiteSpace);

    const interfaces = JsonToTS(json);
    interfaces.forEach((i) => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should support multi nested arrays", function () {
    const json = {
      cats: [
        [{ name: "Kittin" }, { name: "Kittin" }, { name: "Kittin" }],
        [{ name: "Kittin" }, { name: "Kittin" }, { name: "Kittin" }],
      ],
    };

    const expectedTypes = [
      `interface RootObject {
        cats: Cat[][];
      }`,
      `interface Cat {
        name: string;
      }`,
    ].map(removeWhiteSpace);

    JsonToTS(json).forEach((i) => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should singularize array types (dogs: [...] => dogs: Dog[] )", function () {
    const json = {
      dogs: [{ name: "sparky" }, { name: "goodboi" }],
    };

    const expectedTypes = [
      `interface RootObject {
        dogs: Dog[];
      }`,
      `interface Dog {
        name: string;
      }`,
    ].map(removeWhiteSpace);

    const interfaces = JsonToTS(json);
    interfaces.forEach((i) => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should not singularize if not array type (dogs: {} => dogs: Dogs )", function () {
    const json = {
      cats: {
        popularity: "very popular",
      },
    };

    const expectedTypes = [
      `interface RootObject {
        cats: Cats;
      }`,
      `interface Cats {
        popularity: string;
      }`,
    ].map(removeWhiteSpace);

    const interfaces = JsonToTS(json);
    interfaces.forEach((i) => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should capitalize interface names", function () {
    const json = {
      cat: {},
    };

    const expectedTypes = [
      `interface RootObject {
        cat: Cat;
      }`,
      `interface Cat {
      }`,
    ].map(removeWhiteSpace);

    const interfaces = JsonToTS(json);
    interfaces.forEach((i) => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should start unique names increment with 2", function () {
    const json = {
      a: {
        human: { legs: 4 },
      },
      b: {
        human: { arms: 2 },
      },
    };

    const expectedTypes = [
      `interface RootObject {
        a: A;
        b: B;
      }`,
      `interface A {
        human: Human;
      }`,
      `interface B {
        human: Human2;
      }`,
      `interface Human {
        legs: number;
      }`,
      `interface Human2 {
        arms: number;
      }`,
    ].map(removeWhiteSpace);

    const interfaces = JsonToTS(json);
    interfaces.forEach((i) => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should normalize invalid interface names 1", function () {
    const json = {
      "#@#123#@#": {
        name: "dummy string",
      },
    };

    const expectedTypes = [
      `interface RootObject {
        '#@#123#@#': _123;
      }`,
      `interface _123 {
        name: string;
      }`,
    ].map(removeWhiteSpace);

    const interfaces = JsonToTS(json);
    interfaces.forEach((i) => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should normalize invalid interface names 2", function () {
    const json = {
      "hello#@#123#@#": {
        name: "dummy string",
      },
    };

    const expectedTypes = [
      `interface RootObject {
        'hello#@#123#@#': Hello123;
      }`,
      `interface Hello123 {
        name: string;
      }`,
    ].map(removeWhiteSpace);

    const interfaces = JsonToTS(json);

    interfaces.forEach((i) => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should normalize invalid interface names to pascal case", function () {
    const json = {
      "%#hello#@#123#@#": {
        name: "dummy string",
      },
    };

    const expectedTypes = [
      `interface RootObject {
        '%#hello#@#123#@#': Hello123;
      }`,
      `interface Hello123 {
        name: string;
      }`,
    ].map(removeWhiteSpace);

    const interfaces = JsonToTS(json);

    interfaces.forEach((i) => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should generate types instead of interfaces when useTypeAlias - option is used", function () {
    const json = {
      "%#hello#@#123#@#": {
        name: "dummy string",
      },
    };

    const expectedTypes = [
      `type RootObject = {
        '%#hello#@#123#@#': Hello123;
      }`,
      `type Hello123 = {
        name: string;
      }`,
    ].map(removeWhiteSpace);

    const interfaces = JsonToTS(json, { useTypeAlias: true });

    interfaces.forEach((i) => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should have question mark after optional invalid interface name", function () {
    const json = [{ "hello#123": "sample" }, {}];

    const expectedTypes = [
      `interface RootObject {
        'hello#123'?: string;
      }`,
    ].map(removeWhiteSpace);

    const interfaces = JsonToTS(json);

    interfaces.forEach((i) => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should have question mark after null value invalid interface name", function () {
    const json = {
      "hello#123": undefined,
    };

    const expectedTypes = [
      `interface RootObject {
        'hello#123'?: any;
      }`,
    ].map(removeWhiteSpace);

    const interfaces = JsonToTS(json);

    interfaces.forEach((i) => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });

  it("should have question mark after null value invalid optional interface name", function () {
    const json = [{ "hello#123": undefined }, {}];

    const expectedTypes = [
      `interface RootObject {
        'hello#123'?: any;
      }`,
    ].map(removeWhiteSpace);

    const interfaces = JsonToTS(json);

    interfaces.forEach((i) => {
      const noWhiteSpaceInterface = removeWhiteSpace(i);
      assert(expectedTypes.includes(noWhiteSpaceInterface));
    });
  });
});
