import {
  TypeGroup,
  NameEntry,
  NameStructure,
  InterfaceDescription,
} from './model'

import * as pluralize from 'pluralize'
import * as hash from 'hash.js'
import { prettyPrint } from './index'
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

function createTypeDescription (typeObj: any | string[], isUnion): TypeDescription {
  if (isArray(typeObj)) {
    return {
      id: Hash(JSON.stringify(typeObj)),
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
    return typeObjectMatchesTypeDesc(typeObj, el)
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

function typeObjectMatchesTypeDesc (typeObj: any | string[], typeDesc: TypeDescription): boolean {

  if (isArray(typeObj)) {
    return arraysContainSameElements(typeObj, typeDesc.arrayOfTypes)
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


function tryMergeArrayTypes(typesOfArray: string[], types: TypeDescription[]): object | undefined {

  // Only items of object type can be merged
  const canBeMerged = typesOfArray
    .map(typeId => { // return true if array type
      const typeDescription = types.find(type => type.id === typeId)
      return !!(typeDescription && typeDescription.typeObj)
    })
    .reduce(
      (a, b) => a && b,
      true
    )

  if (!canBeMerged && typesOfArray.length > 0)
   return typesOfArray

  const typeObjects = typesOfArray
    .map(typeId => types.find(type => type.id === typeId).typeObj)

  // find key that all typeObject has
  const allKeys = typeObjects
    .map(typeObj => Object.keys(typeObj))
    .reduce(
      (a, b) => [...a, ...b],
      []
    )
    .filter(onlyUnique)

  const mandatoryKeys = typeObjects.reduce(
    (alwaysPresentKeys: string[], typeObj) => {
      const keys = Object.keys(typeObj)
      return alwaysPresentKeys.filter(key => keys.includes(key))
    },
    allKeys
  ) as string[]

  /**
   * Will return typeId of type that can be applied to
   * all keys of objects that are in array
   */
  const getType = key => {
    const typesOfArray = typeObjects
      .filter(typeObj => {
        return Object.keys(typeObj).includes(key)
      })
      .map(typeObj => typeObj[key])
      .filter(onlyUnique)

    if (typesOfArray.length === 1) {
      return typesOfArray.pop()
    } else {
      const arrayType = tryMergeArrayTypes(typesOfArray, types)
      return getIdByType(arrayType, types, true)
    }
  }

  const typeObj = allKeys
    .reduce(
      (obj: object, key: string) => {
        const isMandatory = mandatoryKeys.includes(key)
        const type = getType(key)

        const keyValue = isMandatory ? key : `${key}--?`

        return {
          ...obj,
          [keyValue]: type
        }
      },
      {}
    )
  return typeObj
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
      const arrayInnerType = tryMergeArrayTypes(typesOfArray, types)
      const arrayInnerTypeId = getIdByType(arrayInnerType, types)

      let typeId
      if (isObject(arrayInnerType)) {
        typeId = getIdByType([arrayInnerTypeId], types)
      } else {
        typeId = getIdByType(arrayInnerType, types)
      }

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
      if (typeDesc.arrayOfTypes.length === 1) {
        // if array consist of one type make this array type *singleType*[]
        const [idOrPrimitive] = typeDesc.arrayOfTypes
        const arrayType = isHash(idOrPrimitive) ?
          // array keyName makes no difference in picking name for type
          getNameById(idOrPrimitive, null, true, types, nameMap) :
          idOrPrimitive
        name = `${arrayType}[]`
      } else if (typeDesc.isUnion) {
        name = 'any'
      } else {
        name = 'any[]'
      }

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
        .map(name => uniqueByIncrement(name, nameMap.map(({name}) => name )))
        .pop()
      break

  }

  nameMap.push({id, name})
  return name
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