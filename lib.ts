export function createTypeDescription (typeObj): TypeDescription {
  return {
    id: guid(),
    typeObj
  }
}

export function getIdByTypeObject (typeObj: any, types: TypeDescription[]): string {
  let typeDesc = types.find(el => {
    return compareTypeObjects(el.typeObj, typeObj)
  })

  if(!typeDesc) {
    typeDesc = createTypeDescription(typeObj)
    types.push(typeDesc)
  }

  return typeDesc.id;
}

export function guid (): string {
  function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4()
}

export function compareTypeObjects (a, b): boolean {
  const entriesA = Object.entries(a)
  const entriesB = Object.entries(b)

  const sameLength = entriesA.length === entriesB.length

  const sameTypes = entriesA.every( ([key, value]) => {
    return b[key] === value
  })

  return sameLength && sameTypes
}

function hasSamePrimitiveElements(a: any[], b: any[]) {
  return a.every( el => b.indexOf(el) !== -1);
}

export function isArray (x) {
  return Object.prototype.toString.call(x) === '[object Array]'
}

export function isObject (x) {
  return Object.prototype.toString.call(x) === '[object Object]' && x !== null;
}

export function getSimpleTypeReference (value: any): TypeReference {
  if(value === null) {
    return 'null'
  } else {
    return typeof value
  }
}

export function getTypeGroup(value: any): TypeGroup {
  if(isArray(value)) {
    return TypeGroup.Array
  } else if (isObject(value)) {
    return TypeGroup.Object
  } else {
    return TypeGroup.Primitive
  }
}

export enum TypeGroup {
  Primitive, Array, Object
}

export type TypeReference = string[] | string;

export interface TypeDescription {
  id: string;
  typeObj: any;
}
