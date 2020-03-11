import { InterfaceDescription, NameEntry, TypeStructure, KeyMetaData } from "./model";
import { isHash, findTypeById, isNonArrayUnion } from "./util";

function isKeyNameValid(keyName: string) {
  const regex = /^[a-zA-Z_][a-zA-Z\d_]*$/;
  return regex.test(keyName);
}

function parseKeyMetaData(key: string): KeyMetaData {
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

function findNameById(id: string, names: NameEntry[]): string {
  return names.find(_ => _.id === id).name;
}

function removeNullFromUnion(unionTypeName: string) {
  const typeNames = unionTypeName.split(" | ");
  const nullIndex = typeNames.indexOf("null");
  typeNames.splice(nullIndex, 1);
  return typeNames.join(" | ");
}

function replaceTypeObjIdsWithNames(typeObj: { [index: string]: string }, names: NameEntry[]): object {
  return (
    Object.entries(typeObj)
      // quote key if is invalid and question mark if optional from array merging
      .map(([key, type]): [string, string, boolean] => {
        const { isOptional, keyValue } = parseKeyMetaData(key);
        const isValid = isKeyNameValid(keyValue);

        const validName = isValid ? keyValue : `'${keyValue}'`;

        return isOptional ? [`${validName}?`, type, isOptional] : [validName, type, isOptional];
      })
      // replace hashes with names referencing the hashes
      .map(([key, type, isOptional]): [string, string, boolean] => {
        if (!isHash(type)) {
          return [key, type, isOptional];
        }

        const newType = findNameById(type, names);
        return [key, newType, isOptional];
      })
      // if union has null, remove null and make type optional
      .map(([key, type, isOptional]): [string, string, boolean] => {
        if (!(isNonArrayUnion(type) && type.includes("null"))) {
          return [key, type, isOptional];
        }

        const newType = removeNullFromUnion(type);
        const newKey = isOptional ? key : `${key}?`; // if already optional dont add question mark
        return [newKey, newType, isOptional];
      })
      // make null optional and set type as any
      .map(([key, type, isOptional]): [string, string, boolean] => {
        if (type !== "null") {
          return [key, type, isOptional];
        }

        const newType = "any";
        const newKey = isOptional ? key : `${key}?`; // if already optional dont add question mark
        return [newKey, newType, isOptional];
      })
      .reduce((agg, [key, value]) => {
        agg[key] = value;
        return agg;
      }, {})
  );
}

export function getInterfaceStringFromDescription({ name, typeMap }: InterfaceDescription): string {
  const stringTypeMap = Object.entries(typeMap)
    .map(([key, name]) => `  ${key}: ${name};\n`)
    .reduce((a, b) => (a += b), "");

  let interfaceString = `interface ${name} {\n`;
  interfaceString += stringTypeMap;
  interfaceString += "}";

  return interfaceString;
}

export function getInterfaceDescriptions(typeStructure: TypeStructure, names: NameEntry[]): InterfaceDescription[] {
  return names
    .map(({ id, name }) => {
      const typeDescription = findTypeById(id, typeStructure.types);

      if (typeDescription.typeObj) {
        const typeMap = replaceTypeObjIdsWithNames(typeDescription.typeObj, names);
        return { name, typeMap };
      } else {
        return null;
      }
    })
    .filter(_ => _ !== null);
}
