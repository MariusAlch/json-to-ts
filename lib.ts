
const types: TypeDescription[] = [];
export function findIdByType (type: any, types: TypeDescription[]): string {
  let typeDesc = types.find(typeObj => {
    return compareByTypes(typeObj.typeObj, type)
  })

  if(!typeDesc) {
    typeDesc = createTypeDescription(type)
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

// no deep compare, arguments always objects always defined never null
export function compareByTypes (a, b): boolean {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  const sameLength = keysA.length === keysB.length

  const sameTypes = keysA.every(key => {
    return a[key] === b[key]
  })

  return sameLength && sameTypes
}

export function isArray (x) {
  return Object.prototype.toString.call(x) === '[object Array]'
}

export function isObjectLiteral (x) {
  return Object.prototype.toString.call(x) === '[object Object]'
}

export function isAdvancedType (obj) {
  return isArray(obj) || isObjectLiteral(obj)
}

export function createTypeDescription (typeObj): TypeDescription {
  return {
    id: guid(),
    typeObj
  }
}

export interface TypeDescription {
  id: string;
  typeObj: any;
}

export interface TypeReference {
  id: string;
  array: boolean;
}