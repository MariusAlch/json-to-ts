import * as pluralize from "pluralize";

import { TypeStructure, NameEntry, NameStructure, TypeGroup, TypeDescription } from "./model";
import { getTypeDescriptionGroup, parseKeyMetaData, findTypeById, isHash } from "./util";

function getName(
  { rootTypeId, types }: TypeStructure,
  keyName: string,
  names: NameEntry[],
  isInsideArray: boolean
): NameStructure {
  const typeDesc = types.find((_) => _.id === rootTypeId);

  switch (getTypeDescriptionGroup(typeDesc)) {
    case TypeGroup.Array:
      typeDesc.arrayOfTypes.forEach((typeIdOrPrimitive, i) => {
        getName(
          { rootTypeId: typeIdOrPrimitive, types },
          // to differenttiate array types
          i === 0 ? keyName : `${keyName}${i + 1}`,
          names,
          true
        );
      });
      return {
        rootName: getNameById(typeDesc.id, keyName, isInsideArray, types, names),
        names,
      };

    case TypeGroup.Object:
      Object.entries(typeDesc.typeObj).forEach(([key, value]) => {
        getName({ rootTypeId: value, types }, key, names, false);
      });
      return {
        rootName: getNameById(typeDesc.id, keyName, isInsideArray, types, names),
        names,
      };

    case TypeGroup.Primitive:
      // in this case rootTypeId is primitive type string (string, null, number, boolean)
      return {
        rootName: rootTypeId,
        names,
      };
  }
}

export function getNames(typeStructure: TypeStructure, rootName: string = "RootObject"): NameEntry[] {
  return getName(typeStructure, rootName, [], false).names.reverse();
}

function getNameById(
  id: string,
  keyName: string,
  isInsideArray: boolean,
  types: TypeDescription[],
  nameMap: NameEntry[]
): string {
  let nameEntry = nameMap.find((_) => _.id === id);

  if (nameEntry) {
    return nameEntry.name;
  }

  const typeDesc = findTypeById(id, types);
  const group = getTypeDescriptionGroup(typeDesc);
  let name;

  switch (group) {
    case TypeGroup.Array:
      name = typeDesc.isUnion ? getArrayName(typeDesc, types, nameMap) : formatArrayName(typeDesc, types, nameMap);
      break;

    case TypeGroup.Object:
      /**
       * picking name for type in array requires to singularize that type name,
       * and if not then no need to singularize
       */
      name = [keyName]
        .map((key) => parseKeyMetaData(key).keyValue)
        .map((name) => (isInsideArray ? pluralize.singular(name) : name))
        .map(pascalCase)
        .map(normalizeInvalidTypeName)
        .map(pascalCase) // needed because removed symbols might leave first character uncapitalized
        .map((name) =>
          uniqueByIncrement(
            name,
            nameMap.map(({ name }) => name)
          )
        )
        .pop();
      break;
  }

  nameMap.push({ id, name });
  return name;
}

function pascalCase(name: string) {
  return name
    .split(/\s+/g)
    .filter((_) => _ !== "")
    .map(capitalize)
    .reduce((a, b) => a + b, "");
}

function capitalize(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function normalizeInvalidTypeName(name: string): string {
  if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
    return name;
  } else {
    const noSymbolsName = name.replace(/[^a-zA-Z0-9]/g, "");
    const startsWithWordCharacter = /^[a-zA-Z]/.test(noSymbolsName);
    return startsWithWordCharacter ? noSymbolsName : `_${noSymbolsName}`;
  }
}

function uniqueByIncrement(name: string, names: string[]): string {
  for (let i = 0; i < 1000; i++) {
    const nameProposal = i === 0 ? name : `${name}${i + 1}`;
    if (!names.includes(nameProposal)) {
      return nameProposal;
    }
  }
}

function getArrayName(typeDesc: TypeDescription, types: TypeDescription[], nameMap: NameEntry[]): string {
  if (typeDesc.arrayOfTypes.length === 0) {
    return "any";
  } else if (typeDesc.arrayOfTypes.length === 1) {
    const [idOrPrimitive] = typeDesc.arrayOfTypes;
    return convertToReadableType(idOrPrimitive, types, nameMap);
  } else {
    return unionToString(typeDesc, types, nameMap);
  }
}

function convertToReadableType(idOrPrimitive: string, types: TypeDescription[], nameMap: NameEntry[]): string {
  return isHash(idOrPrimitive)
    ? // array keyName makes no difference in picking name for type
      getNameById(idOrPrimitive, null, true, types, nameMap)
    : idOrPrimitive;
}

function unionToString(typeDesc: TypeDescription, types: TypeDescription[], nameMap: NameEntry[]): string {
  return typeDesc.arrayOfTypes.reduce((acc, type, i) => {
    const readableTypeName = convertToReadableType(type, types, nameMap);
    return i === 0 ? readableTypeName : `${acc} | ${readableTypeName}`;
  }, "");
}

function formatArrayName(typeDesc: TypeDescription, types: TypeDescription[], nameMap: NameEntry[]): string {
  const innerTypeId = typeDesc.arrayOfTypes[0];
  // const isMultipleTypeArray = findTypeById(innerTypeId, types).arrayOfTypes.length > 1
  const isMultipleTypeArray =
    isHash(innerTypeId) &&
    findTypeById(innerTypeId, types).isUnion &&
    findTypeById(innerTypeId, types).arrayOfTypes.length > 1;

  const readableInnerType = getArrayName(typeDesc, types, nameMap);

  return isMultipleTypeArray
    ? `(${readableInnerType})[]` // add semicolons for union type
    : `${readableInnerType}[]`;
}
