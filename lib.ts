import {
  TypeDescription,
  TypeGroup,
  TypeStructure,
  NameEntry,
  NameStructure
} from './model'

export function createTypeDescription (typeObj: any | string[]): TypeDescription {
  if (isArray(typeObj)) {
    return {
      id: UUID(),
      arrayOfTypes: typeObj
    }
  } else {
    return {
      id: UUID(),
      typeObj
    }
  }
}

export function getIdByType (typeObj: any | string[], types: TypeDescription[]): string {

  let typeDesc = types.find(el => {
    return typeObjectMatchesTypeDesc(typeObj, el)
  })

  if (!typeDesc) {
    typeDesc = createTypeDescription(typeObj)
    types.push(typeDesc)
  }

  return typeDesc.id
}

export function UUID (): string {
  function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4()
}

export function typeObjectMatchesTypeDesc (typeObj: any | string[], typeDesc: TypeDescription): boolean {

  if (isArray(typeObj)) {
    return arraysContainSameElements(typeObj, typeDesc.arrayOfTypes)
  } else {
    return objectsHaveSameEntries(typeObj, typeDesc.typeObj)
  }

}

function arraysContainSameElements(arr1: any[], arr2: any[]): boolean {
  if (arr1 === undefined || arr2 === undefined) return false

  const filteredArray = arr1.filter( value => {
      return arr2.indexOf(value) > -1
  })

  return filteredArray.length === arr1.length
}

function objectsHaveSameEntries(obj1: any, obj2: any): boolean {
  if (obj1 === undefined || obj2 === undefined) return false


  const entries1 = Object.entries(obj1)
  const entries2 = Object.entries(obj2)

  const sameLength = entries1.length === entries2.length

  const sameTypes = entries1.every( ([key, value]) => {
    return obj2[key] === value
  })

  return sameLength && sameTypes
}

export function hasSamePrimitiveElements(a: any[], b: any[]) {
  return a.every( el => b.indexOf(el) !== -1)
}

export function isArray (x) {
  return Object.prototype.toString.call(x) === '[object Array]'
}

export function isObject (x) {
  return Object.prototype.toString.call(x) === '[object Object]' && x !== null
}

export function getSimpleTypeName (value: any): string {
  if (value === null) {
    return 'null'
  } else {
    return typeof value
  }
}

export function getTypeGroup(value: any): TypeGroup {
  if (isArray(value)) {
    return TypeGroup.Array
  } else if (isObject(value)) {
    return TypeGroup.Object
  } else {
    return TypeGroup.Primitive
  }
}
export function prettyPrint(json) {
  console.log(
    JSON.stringify(json, null, 4)
  )
}

export function generateTypeName(str: string, index: number = 0): string {
  const postFix = index === 0 ? '' : index
  return str.charAt(0).toUpperCase() + str.slice(1) + postFix
}

export function createTypeObject(obj: any, types: TypeDescription[]): any {
  return Object.entries(obj).reduce( (typeObj, [key, value]) => {
      const {rootTypeId} = getTypeStructure(value, types)

      return {
        [key]: rootTypeId,
        ...typeObj
      }
    },
    {}
  )
}

export function getTypeStructure(
  targetObj: any, // object that we want to create types for
  types: TypeDescription[] = [],
): TypeStructure {
  switch (getTypeGroup(targetObj)) {

    case TypeGroup.Array:
      const typesOfArray = (<any[]>targetObj)
      .map( _ => getTypeStructure(_, types).rootTypeId)
      .filter( (id, i, arr) => arr.indexOf(id) === i)

      const arrayType = getIdByType(typesOfArray, types)

      return {
        rootTypeId: arrayType,
        types
      }

    case TypeGroup.Object:
      const typeObj = createTypeObject(targetObj, types)
      const objType = getIdByType(typeObj, types)

      return {
        rootTypeId: objType,
        types
      }

    case TypeGroup.Primitive:
      const simpleType = getSimpleTypeName(targetObj)

      return {
        rootTypeId: simpleType,
        types
      }
  }
}

export function isUUID(str: string) {
  return str.length === 36
}

export function getTypeDescriptionGroup(desc: TypeDescription): TypeGroup {
  if (desc === undefined) {
    return TypeGroup.Primitive
  } else if (desc.arrayOfTypes !== undefined) {
    return TypeGroup.Array
  } else {
    return TypeGroup.Object
  }
}

export function interfaceNameFromString(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export function getNameFromId (
  id: string,
  keyName: string,
  types: TypeDescription[],
  nameMap: {id: string, name: string}[]
): string {
  let nameEntry = nameMap.find(_ => _.id === id)

  if (nameEntry) {
    return nameEntry.name
  }

  const typeDesc = types.find(_ => _.id === id)
  const group = getTypeDescriptionGroup(typeDesc)
  let name

  switch (group) {
    case TypeGroup.Array:
      // const typeName = interfaceNameFromString(keyName)

      if (typeDesc.arrayOfTypes.length === 1) {
        // if array consist of one type make this array type *singleType*[]

        const [idOrPrimitive] = typeDesc.arrayOfTypes
        let arrayType

        if (isUUID(idOrPrimitive)) {
          arrayType = getNameFromId(idOrPrimitive, 'this should never be seen', types, nameMap)
        } else {
          arrayType = idOrPrimitive
        }

        name = `${arrayType}[]`
      } else {
        name = 'any[]'
      }

      break
    case TypeGroup.Object:
      name = interfaceNameFromString(keyName)
      break
  }

  nameMap.push({id, name})
  return name
}

export function getName(
  { rootTypeId, types }: TypeStructure,
  keyName: string,
  names: NameEntry[]
): NameStructure {
  const typeDesc = types.find(_ => _.id === rootTypeId)

  switch (getTypeDescriptionGroup(typeDesc)) {

    case TypeGroup.Array:
      typeDesc.arrayOfTypes
        .forEach((typeIdOrPrimitive, i) => {
          return getName(
            { rootTypeId: typeIdOrPrimitive, types },
            // to differenttiate array types
            `${keyName}${i === 0 ? '' : (i + 1)}`,
            names
          )
        })
      return {
        rootName: getNameFromId(typeDesc.id, keyName, types, names),
        names
      }

    case TypeGroup.Object:
      Object.entries(typeDesc.typeObj)
        .forEach( ([key, value]) => getName(
          { rootTypeId: value, types },
          key,
          names
        ))
      return {
        rootName: getNameFromId(typeDesc.id, keyName, types, names),
        names
      }

    case TypeGroup.Primitive:
      return {
        rootName: rootTypeId,
        names
      }
  }
}

export function getNameStructure(typeStructure: TypeStructure): NameStructure {
  return getName(typeStructure, 'RootObject', [])
}