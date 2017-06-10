import {
  TypeGroup,
  NameEntry,
  NameStructure,
  InterfaceDescription,
} from './model'

import * as pluralize from 'pluralize'
import * as hash from 'hash.js'
import { TypeDescription, KeyMetaData, TypeStructure } from './model'

export function onlyUnique(value, index, self) {
    return self.indexOf(value) === index
}

function pascalCase (name: string) {
  return name
    .split(/\s+/g)
    .filter(_ => _ !== '')
    .map(capitalize)
    .reduce((a, b) => a + b)
}

function createTypeDescription (typeObj: any | string[], isUnion: boolean): TypeDescription {
  if (isArray(typeObj)) {
    return {
      id: Hash(JSON.stringify([...typeObj, isUnion])),
      arrayOfTypes: typeObj,
      isUnion
    }
  } else {
    return {
      id: Hash(JSON.stringify(typeObj)),
      typeObj
    }
  }
}

function getIdByType (typeObj: any | string[], types: TypeDescription[], isUnion: boolean = false): string {

  let typeDesc = types.find(el => {
    return typeObjectMatchesTypeDesc(typeObj, el, isUnion)
  })

  if (!typeDesc) {
    typeDesc = createTypeDescription(typeObj, isUnion)
    types.push(typeDesc)
  }

  return typeDesc.id
}

function Hash (content: string): string {
  return hash.sha1().update(content).digest('hex')
}

function typeObjectMatchesTypeDesc (typeObj: any | string[], typeDesc: TypeDescription, isUnion): boolean {

  if (isArray(typeObj)) {
    return arraysContainSameElements(typeObj, typeDesc.arrayOfTypes) && typeDesc.isUnion === isUnion
  } else {
    return objectsHaveSameEntries(typeObj, typeDesc.typeObj)
  }

}

function arraysContainSameElements(arr1: any[], arr2: any[]): boolean {
  if (arr1 === undefined || arr2 === undefined) return false

  return arr1.sort().join('') === arr2.sort().join('')
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

function hasSamePrimitiveElements(a: any[], b: any[]) {
  return a.every( el => b.indexOf(el) !== -1)
}

export function isArray (x) {
  return Object.prototype.toString.call(x) === '[object Array]'
}

export function isObject (x) {
  return Object.prototype.toString.call(x) === '[object Object]' && x !== null
}

function getSimpleTypeName (value: any): string {
  if (value === null) {
    return 'null'
  } else {
    return typeof value
  }
}

function getTypeGroup(value: any): TypeGroup {
  if (isArray(value)) {
    return TypeGroup.Array
  } else if (isObject(value)) {
    return TypeGroup.Object
  } else {
    return TypeGroup.Primitive
  }
}

function generateTypeName(str: string, index: number = 0): string {
  const postFix = index === 0 ? '' : index
  return str.charAt(0).toUpperCase() + str.slice(1) + postFix
}

function createTypeObject(obj: any, types: TypeDescription[]): any {
  return Object.entries(obj)
    .reduce( (typeObj, [key, value]) => {
        const {rootTypeId} = getTypeStructure(value, types)

        return {
          ...typeObj,
          [key]: rootTypeId,
        }
      },
      {}
    )
}

function findTypeById(id: string, types: TypeDescription[]): TypeDescription {
  return types.find(_ => _.id === id)
}

function getMergedObjects(typesOfArray: TypeDescription[], types: TypeDescription[]): string {

  const typeObjects = typesOfArray
    .map(typeDesc => typeDesc.typeObj)

  const allKeys = typeObjects
    .map(typeObj => Object.keys(typeObj))
    .reduce(
      (a, b) => [...a, ...b],
      []
    )
    .filter(onlyUnique)

  const commonKeys = typeObjects.reduce(
    (commonKeys: string[], typeObj) => {
      const keys = Object.keys(typeObj)
      return commonKeys.filter(key => keys.includes(key))
    },
    allKeys
  ) as string[]

  const getKeyType = key => {
    const typesOfKey = typeObjects
      .filter(typeObj => {
        return Object.keys(typeObj).includes(key)
      })
      .map(typeObj => typeObj[key])
      .filter(onlyUnique)

    if (typesOfKey.length === 1) {
      return typesOfKey.pop()
    } else {
      return getInnerArrayType(typesOfKey, types)
    }
  }

  const typeObj = allKeys
    .reduce(
      (obj: object, key: string) => {
        const isMandatory = commonKeys.includes(key)
        const type = getKeyType(key)

        const keyValue = isMandatory ? key : toOptionalKey(key)

        return {
          ...obj,
          [keyValue]: type
        }
      },
      {}
    )
  return getIdByType(typeObj, types, true)
}

function toOptionalKey(key: string): string {
  return key.endsWith('--?') ? key : `${key}--?`
}

function getMergedArrays(typesOfArray: TypeDescription[], types: TypeDescription[]): string {
  const idsOfArrayTypes = typesOfArray
    .map(typeDesc => typeDesc.arrayOfTypes)
    .reduce(
      (a, b) => [...a, ...b],
      []
    )
    .filter(onlyUnique)

  if (idsOfArrayTypes.length === 1) {
    return getIdByType([idsOfArrayTypes.pop()], types)
  } else {
    return getIdByType([getInnerArrayType(idsOfArrayTypes, types)], types)
  }
}

// we merge union types example: (number | string), null -> (number | string | null)
function getMergedUnion(typesOfArray: string[], types: TypeDescription[]): string {
  const innerUnionsTypes = typesOfArray
    .map(id => {
      return findTypeById(id, types)
    })
    .filter(_ => !!_ && _.isUnion)
    .map(_ => _.arrayOfTypes)
    .reduce(
      (a, b) => [...a, ...b],
      []
    )

  const primitiveTypes = typesOfArray
    .filter(id => !findTypeById(id, types) || !findTypeById(id, types).isUnion) // primitives or not union
  return getIdByType([...innerUnionsTypes, ...primitiveTypes], types, true)
}

function getInnerArrayType(typesOfArray: string[], types: TypeDescription[]): string { // return inner array type

  const arrayTypesDescriptions = typesOfArray
    .map(id => findTypeById(id, types))
    .filter(_ => !!_)

  const allArrayType = arrayTypesDescriptions
    .filter(typeDesc => getTypeDescriptionGroup(typeDesc) === TypeGroup.Array)
    .length === typesOfArray.length

  const allPrimitiveType = arrayTypesDescriptions.length === 0

  const allObjectType = arrayTypesDescriptions
    .filter(typeDesc => getTypeDescriptionGroup(typeDesc) === TypeGroup.Object)
    .length === typesOfArray.length

  const canBeMerged = arrayTypesDescriptions.length > 0 && (allArrayType || allObjectType)


  if (typesOfArray.length === 0) { // no types in array -> empty union type
    return getIdByType([], types, true)
  }

  if (typesOfArray.length === 1) { // one type in array -> that will be our inner type
    return typesOfArray.pop()
  }

  if (typesOfArray.length > 1) { // multiple types in merge array
    // if all are object we can merge them and return merged object as inner type
    if (allObjectType) return getMergedObjects(arrayTypesDescriptions, types)
    // if all are array we can merge them and return merged array as inner type
    if (allArrayType) return getMergedArrays(arrayTypesDescriptions, types)

    // if they are mixed or all primitive we cant merge them so we return as mixed union type
    return getMergedUnion(typesOfArray, types)
  }
}

export function getTypeStructure(
  targetObj: any, // object that we want to create types for
  types: TypeDescription[] = [],
): TypeStructure {
  switch (getTypeGroup(targetObj)) {

    case TypeGroup.Array:
      const typesOfArray = (<any[]>targetObj)
        .map( _ => getTypeStructure(_, types).rootTypeId)
        .filter(onlyUnique)
      const arrayInnerTypeId = getInnerArrayType(typesOfArray, types) // create "union type of array types"
      const typeId = getIdByType([arrayInnerTypeId], types) // create type "array of union type"

      return {
        rootTypeId: typeId,
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

function isHash(str: string) {
  return str.length === 40
}

function getTypeDescriptionGroup(desc: TypeDescription): TypeGroup {
  if (desc === undefined) {
    return TypeGroup.Primitive
  } else if (desc.arrayOfTypes !== undefined) {
    return TypeGroup.Array
  } else {
    return TypeGroup.Object
  }
}

function capitalize(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function getName(
  { rootTypeId, types }: TypeStructure,
  keyName: string,
  names: NameEntry[],
  isInsideArray: boolean,
): NameStructure {
  const typeDesc = types.find(_ => _.id === rootTypeId)

  switch (getTypeDescriptionGroup(typeDesc)) {

    case TypeGroup.Array:
      typeDesc.arrayOfTypes
        .forEach((typeIdOrPrimitive, i) => {
          getName(
            { rootTypeId: typeIdOrPrimitive, types },
            // to differenttiate array types
            i === 0 ? keyName : `${keyName}${i + 1}`,
            names,
            true
          )
        })
      return {
        rootName: getNameById(typeDesc.id, keyName, isInsideArray, types, names),
        names
      }

    case TypeGroup.Object:
      Object.entries(typeDesc.typeObj)
        .forEach( ([key, value]) => {
          getName(
            { rootTypeId: value, types },
            key,
            names,
            false
          )
        })
      return {
        rootName: getNameById(typeDesc.id, keyName, isInsideArray, types, names),
        names
      }

    case TypeGroup.Primitive:
      // in this case rootTypeId is primitive type string (string, null, number, boolean)
      return {
        rootName: rootTypeId,
        names
      }
  }
}

export function getNames(typeStructure: TypeStructure, rootName: string = 'RootObject'): NameEntry[] {
  return getName(typeStructure, rootName, [], false).names.reverse()
}

function getNameById (
  id: string,
  keyName: string,
  isInsideArray: boolean,
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
      const getName = typeDesc => {
        if (typeDesc.arrayOfTypes.length === 1) {
          // if array consist of one type make this array type *singleType*[]
          const [idOrPrimitive] = typeDesc.arrayOfTypes
          const arrayType = isHash(idOrPrimitive) ?
            // array keyName makes no difference in picking name for type
            getNameById(idOrPrimitive, null, true, types, nameMap) :
            idOrPrimitive
          return arrayType
        } else {
          return 'any'
        }
      }

      name = typeDesc.isUnion ? getName(typeDesc) : `${getName(typeDesc)}[]`
      break

    case TypeGroup.Object:
      /**
       * picking name for type in array requires to singularize that type name,
       * and if not then no need to singularize
       */
      name = [keyName]
        .map(key => parseKeyMetaData(key).keyValue)
        .map(name => isInsideArray ? pluralize.singular(name) : name)
        .map(pascalCase)
        .map(normalizeInvalidTypeName)
        .map(name => uniqueByIncrement(name, nameMap.map(({name}) => name )))
        .pop()
      break

  }

  nameMap.push({id, name})
  return name
}

function normalizeInvalidTypeName (name: string): string {
  if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
    return name
  } else {
    const noSymbolsName = name.replace(/[^a-zA-Z0-9]/g, '')
    const startsWithWordCharacter = /^[a-zA-Z]/.test(noSymbolsName)
    return startsWithWordCharacter ?
      noSymbolsName :
      `_${noSymbolsName}`
  }
}

function uniqueByIncrement (name: string, names: string[]): string {
  for (let i = 0; i < 1000; i++) {
    const nameProposal = i === 0 ? name : `${name}${i + 1}`
    if (!names.includes(nameProposal)) {
      return nameProposal
    }
  }
}

function getAllUsedTypeIds({rootTypeId, types}: TypeStructure): string[] {
  const typeDesc = types.find(_ => _.id === rootTypeId)

  const subTypes = (typeDesc: TypeDescription) => {
    switch (getTypeDescriptionGroup(typeDesc)) {

      case TypeGroup.Array:
        const arrSubTypes = typeDesc.arrayOfTypes
          .filter(isHash)
          .map(typeId => {
            const typeDesc = types.find(_ => _.id === typeId)
            return subTypes(typeDesc)
          })
          .reduce(
            (a, b) => [...a, ...b],
            []
          )
        return [typeDesc.id, ...arrSubTypes]

      case TypeGroup.Object:
        const objSubTypes = Object.values(typeDesc.typeObj)
          .filter(isHash)
          .map(typeId => {
            const typeDesc = types.find(_ => _.id === typeId)
            return subTypes(typeDesc)
          })
          .reduce(
            (a, b) => [...a, ...b],
            []
          )
        return [typeDesc.id, ...objSubTypes]
    }
  }

  return subTypes(typeDesc)
}

function findNameById (
  id: string,
  names: NameEntry[]
): string {
  return names.find(_ => _.id === id).name
}

function isKeyNameValid(keyName: string) {
  const regex = /^[a-zA-Z][a-zA-Z\d]*$/
  return regex.test(keyName)
}

function parseKeyMetaData(key: string): KeyMetaData {
  const isOptional = key.endsWith('--?')

  if (isOptional) {
    return {
      isOptional,
      keyValue: key.slice(0, -3)
    }
  } else {
    return {
      isOptional,
      keyValue: key
    }
  }

}

function replaceTypeObjIdsWithNames (typeObj: object, names: NameEntry[]): object {
    return Object.entries(typeObj)
      .map(([key, type]) => {
        const {isOptional, keyValue} = parseKeyMetaData(key)
        const isValid = isKeyNameValid(keyValue)

        const keyLiteral = isOptional ? `${keyValue}?` : keyValue
        return isValid  ?
            [keyLiteral, type] :
            [`'${keyLiteral}'`, type]
      })
      .map(([key, type]) => {
        if (isHash(type)) { // we only need to replace ids not primitive types
          const name = findNameById(type, names)
          return [key, name]
        } else {
          const entry = type === 'null' ?
                     [`${key}?`, 'any'] :
                     [   key   , type]
          return entry
        }
      })
      .reduce(
        (agg, [key, value]) => {
          agg[key] = value
          return agg
        },
        {}
      )
}

export function getInterfaceDescriptions(
  typeStructure: TypeStructure,
  names: NameEntry[]
): InterfaceDescription[] {

  return names
    .map(({id, name}) => {
      const typeDescription = typeStructure.types.find( type => type.id === id)

      if (typeDescription.typeObj) {
        const typeMap = replaceTypeObjIdsWithNames(typeDescription.typeObj, names)
        return {name, typeMap}
      } else {
        return null
      }

    })
    .filter(_ => _ !== null)
}

export function getInterfaceStringFromDescription({name, typeMap}: InterfaceDescription): string {

  const stringTypeMap = Object.entries(typeMap)
    .map(([key, name]) => `  ${key}: ${name};\n`)
    .reduce(
      (a, b) => a += b,
      ''
    )

  let interfaceString =  `interface ${name} {\n`
      interfaceString +=  stringTypeMap
      interfaceString += '}'

  return interfaceString
}

export function optimizeTypeStructure (typeStructure: TypeStructure) {
  const usedTypeIds = getAllUsedTypeIds(typeStructure)

  const optimizedTypes = typeStructure.types
    .filter(typeDesc => usedTypeIds.includes(typeDesc.id))

  typeStructure.types = optimizedTypes
}