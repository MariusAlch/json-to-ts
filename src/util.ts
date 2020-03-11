import { KeyMetaData, TypeGroup, TypeDescription } from "./model";

export function isHash(str: string) {
  return str.length === 40;
}

export function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

export function isArray(x) {
  return Object.prototype.toString.call(x) === "[object Array]";
}

export function isNonArrayUnion(typeName: string) {
  const arrayUnionRegex = /^\(.*\)\[\]$/;

  return typeName.includes(" | ") && !arrayUnionRegex.test(typeName);
}

export function isObject(x) {
  return Object.prototype.toString.call(x) === "[object Object]" && x !== null;
}

export function isDate(x) {
  return x instanceof Date;
}

export function parseKeyMetaData(key: string): KeyMetaData {
  const isOptional = key.endsWith("--?");

  if (isOptional) {
    return {
      isOptional,
      keyValue: key.slice(0, -3)
    };
  } else {
    return {
      isOptional,
      keyValue: key
    };
  }
}

export function getTypeDescriptionGroup(desc: TypeDescription): TypeGroup {
  if (desc === undefined) {
    return TypeGroup.Primitive;
  } else if (desc.arrayOfTypes !== undefined) {
    return TypeGroup.Array;
  } else {
    return TypeGroup.Object;
  }
}

export function findTypeById(id: string, types: TypeDescription[]): TypeDescription {
  return types.find(_ => _.id === id);
}
