import * as hash from "hash.js";

import { TypeDescription, TypeStructure } from "./model";
import { isHash, getTypeDescriptionGroup, findTypeById, isArray, isObject, onlyUnique, isDate } from "./util";
import { TypeGroup } from "./model";

function createTypeDescription(typeObj: any | string[], isUnion: boolean): TypeDescription {
  if (isArray(typeObj)) {
    return {
      id: Hash(JSON.stringify([...typeObj, isUnion])),
      arrayOfTypes: typeObj,
      isUnion,
    };
  } else {
    return {
      id: Hash(JSON.stringify(typeObj)),
      typeObj,
    };
  }
}

function getIdByType(typeObj: any | string[], types: TypeDescription[], isUnion: boolean = false): string {
  let typeDesc = types.find((el) => {
    return typeObjectMatchesTypeDesc(typeObj, el, isUnion);
  });

  if (!typeDesc) {
    typeDesc = createTypeDescription(typeObj, isUnion);
    types.push(typeDesc);
  }

  return typeDesc.id;
}

function Hash(content: string): string {
  return (hash as any).sha1().update(content).digest("hex");
}

function typeObjectMatchesTypeDesc(typeObj: any | string[], typeDesc: TypeDescription, isUnion): boolean {
  if (isArray(typeObj)) {
    return arraysContainSameElements(typeObj, typeDesc.arrayOfTypes) && typeDesc.isUnion === isUnion;
  } else {
    return objectsHaveSameEntries(typeObj, typeDesc.typeObj);
  }
}

function arraysContainSameElements(arr1: any[], arr2: any[]): boolean {
  if (arr1 === undefined || arr2 === undefined) return false;

  return arr1.sort().join("") === arr2.sort().join("");
}

function objectsHaveSameEntries(obj1: any, obj2: any): boolean {
  if (obj1 === undefined || obj2 === undefined) return false;

  const entries1 = Object.entries(obj1);
  const entries2 = Object.entries(obj2);

  const sameLength = entries1.length === entries2.length;

  const sameTypes = entries1.every(([key, value]) => {
    return obj2[key] === value;
  });

  return sameLength && sameTypes;
}

function getSimpleTypeName(value: any): string {
  if (value === null) {
    return "null";
  } else if (value instanceof Date) {
    return "Date";
  } else {
    return typeof value;
  }
}

function getTypeGroup(value: any): TypeGroup {
  if (isDate(value)) {
    return TypeGroup.Date;
  } else if (isArray(value)) {
    return TypeGroup.Array;
  } else if (isObject(value)) {
    return TypeGroup.Object;
  } else {
    return TypeGroup.Primitive;
  }
}

function createTypeObject(obj: any, types: TypeDescription[]): any {
  return Object.entries(obj).reduce((typeObj, [key, value]) => {
    const { rootTypeId } = getTypeStructure(value, types);

    return {
      ...typeObj,
      [key]: rootTypeId,
    };
  }, {});
}

function getMergedObjects(typesOfArray: TypeDescription[], types: TypeDescription[]): string {
  const typeObjects = typesOfArray.map((typeDesc) => typeDesc.typeObj);

  const allKeys = typeObjects
    .map((typeObj) => Object.keys(typeObj))
    .reduce((a, b) => [...a, ...b], [])
    .filter(onlyUnique);

  const commonKeys = typeObjects.reduce((commonKeys: string[], typeObj) => {
    const keys = Object.keys(typeObj);
    return commonKeys.filter((key) => keys.includes(key));
  }, allKeys) as string[];

  const getKeyType = (key) => {
    const typesOfKey = typeObjects
      .filter((typeObj) => {
        return Object.keys(typeObj).includes(key);
      })
      .map((typeObj) => typeObj[key])
      .filter(onlyUnique);

    if (typesOfKey.length === 1) {
      return typesOfKey.pop();
    } else {
      return getInnerArrayType(typesOfKey, types);
    }
  };

  const typeObj = allKeys.reduce((obj: object, key: string) => {
    const isMandatory = commonKeys.includes(key);
    const type = getKeyType(key);

    const keyValue = isMandatory ? key : toOptionalKey(key);

    return {
      ...obj,
      [keyValue]: type,
    };
  }, {});
  return getIdByType(typeObj, types, true);
}

function toOptionalKey(key: string): string {
  return key.endsWith("--?") ? key : `${key}--?`;
}

function getMergedArrays(typesOfArray: TypeDescription[], types: TypeDescription[]): string {
  const idsOfArrayTypes = typesOfArray
    .map((typeDesc) => typeDesc.arrayOfTypes)
    .reduce((a, b) => [...a, ...b], [])
    .filter(onlyUnique);

  if (idsOfArrayTypes.length === 1) {
    return getIdByType([idsOfArrayTypes.pop()], types);
  } else {
    return getIdByType([getInnerArrayType(idsOfArrayTypes, types)], types);
  }
}

// we merge union types example: (number | string), null -> (number | string | null)
function getMergedUnion(typesOfArray: string[], types: TypeDescription[]): string {
  const innerUnionsTypes = typesOfArray
    .map((id) => {
      return findTypeById(id, types);
    })
    .filter((_) => !!_ && _.isUnion)
    .map((_) => _.arrayOfTypes)
    .reduce((a, b) => [...a, ...b], []);

  const primitiveTypes = typesOfArray.filter((id) => !findTypeById(id, types) || !findTypeById(id, types).isUnion); // primitives or not union
  return getIdByType([...innerUnionsTypes, ...primitiveTypes], types, true);
}

function getInnerArrayType(typesOfArray: string[], types: TypeDescription[]): string {
  // return inner array type

  const containsUndefined = typesOfArray.includes("undefined");

  const arrayTypesDescriptions = typesOfArray.map((id) => findTypeById(id, types)).filter((_) => !!_);

  const allArrayType =
    arrayTypesDescriptions.filter((typeDesc) => getTypeDescriptionGroup(typeDesc) === TypeGroup.Array).length ===
    typesOfArray.length;

  const allArrayTypeWithUndefined =
    arrayTypesDescriptions.filter((typeDesc) => getTypeDescriptionGroup(typeDesc) === TypeGroup.Array).length + 1 ===
      typesOfArray.length && containsUndefined;

  const allObjectTypeWithUndefined =
    arrayTypesDescriptions.filter((typeDesc) => getTypeDescriptionGroup(typeDesc) === TypeGroup.Object).length + 1 ===
      typesOfArray.length && containsUndefined;

  const allObjectType =
    arrayTypesDescriptions.filter((typeDesc) => getTypeDescriptionGroup(typeDesc) === TypeGroup.Object).length ===
    typesOfArray.length;

  if (typesOfArray.length === 0) {
    // no types in array -> empty union type
    return getIdByType([], types, true);
  }

  if (typesOfArray.length === 1) {
    // one type in array -> that will be our inner type
    return typesOfArray.pop();
  }

  if (typesOfArray.length > 1) {
    // multiple types in merge array
    // if all are object we can merge them and return merged object as inner type
    if (allObjectType) return getMergedObjects(arrayTypesDescriptions, types);
    // if all are array we can merge them and return merged array as inner type
    if (allArrayType) return getMergedArrays(arrayTypesDescriptions, types);

    // all array types with posibble undefined, result type = undefined | (*mergedArray*)[]
    if (allArrayTypeWithUndefined) {
      return getMergedUnion([getMergedArrays(arrayTypesDescriptions, types), "undefined"], types);
    }

    // all object types with posibble undefined, result type = undefined | *mergedObject*
    if (allObjectTypeWithUndefined) {
      return getMergedUnion([getMergedObjects(arrayTypesDescriptions, types), "undefined"], types);
    }

    // if they are mixed or all primitive we cant merge them so we return as mixed union type
    return getMergedUnion(typesOfArray, types);
  }
}

export function getTypeStructure(
  targetObj: any, // object that we want to create types for
  types: TypeDescription[] = []
): TypeStructure {
  switch (getTypeGroup(targetObj)) {
    case TypeGroup.Array:
      const typesOfArray = (<any[]>targetObj).map((_) => getTypeStructure(_, types).rootTypeId).filter(onlyUnique);
      const arrayInnerTypeId = getInnerArrayType(typesOfArray, types); // create "union type of array types"
      const typeId = getIdByType([arrayInnerTypeId], types); // create type "array of union type"

      return {
        rootTypeId: typeId,
        types,
      };

    case TypeGroup.Object:
      const typeObj = createTypeObject(targetObj, types);
      const objType = getIdByType(typeObj, types);

      return {
        rootTypeId: objType,
        types,
      };

    case TypeGroup.Primitive:
      return {
        rootTypeId: getSimpleTypeName(targetObj),
        types,
      };

    case TypeGroup.Date:
      const dateType = getSimpleTypeName(targetObj);

      return {
        rootTypeId: dateType,
        types,
      };
  }
}

function getAllUsedTypeIds({ rootTypeId, types }: TypeStructure): string[] {
  const typeDesc = types.find((_) => _.id === rootTypeId);

  const subTypes = (typeDesc: TypeDescription) => {
    switch (getTypeDescriptionGroup(typeDesc)) {
      case TypeGroup.Array:
        const arrSubTypes = typeDesc.arrayOfTypes
          .filter(isHash)
          .map((typeId) => {
            const typeDesc = types.find((_) => _.id === typeId);
            return subTypes(typeDesc);
          })
          .reduce((a, b) => [...a, ...b], []);
        return [typeDesc.id, ...arrSubTypes];

      case TypeGroup.Object:
        const objSubTypes = Object.values(typeDesc.typeObj)
          .filter(isHash)
          .map((typeId) => {
            const typeDesc = types.find((_) => _.id === typeId);
            return subTypes(typeDesc);
          })
          .reduce((a, b) => [...a, ...b], []);
        return [typeDesc.id, ...objSubTypes];
    }
  };

  return subTypes(typeDesc);
}

export function optimizeTypeStructure(typeStructure: TypeStructure) {
  const usedTypeIds = getAllUsedTypeIds(typeStructure);

  const optimizedTypes = typeStructure.types.filter((typeDesc) => usedTypeIds.includes(typeDesc.id));

  typeStructure.types = optimizedTypes;
}
