import {
  TypeDescription,
  TypeGroup,
  TypeStructure,
  NameEntry,
  NameStructure,
  InterfaceDescription
} from './model'

import * as pluralize from 'pluralize'

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index
}

function pascalCase (name: string) {
  return name
    .split(/\s+/g)
    .filter(_ => _ !== '')
    .map(capitalize)
    .reduce((a, b) => a + b)
}

function createTypeDescription (typeObj: any | string[]): TypeDescription {
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

function getIdByType (typeObj: any | string[], types: TypeDescription[]): string {

  let typeDesc = types.find(el => {
    return typeObjectMatchesTypeDesc(typeObj, el)
  })

  if (!typeDesc) {
    typeDesc = createTypeDescription(typeObj)
    types.push(typeDesc)
  }

  return typeDesc.id
}

function UUID (): string {
  function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4()
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

function isArray (x) {
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

function isUUID(str: string) {
  return str.length === 36
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
        let arrayType = isUUID(idOrPrimitive) ?
          // array keyName makes no difference in picking name for type
          getNameById(idOrPrimitive, null, true, types, nameMap) :
          idOrPrimitive

        name = `${arrayType}[]`
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

function proposeRemoveTypes (typesToDelete: string[], typeDescriptions: TypeDescription[]) {
  typesToDelete.forEach(type => {
    const idsOfAllTypes = typeDescriptions
      .map(desc => {
        switch (getTypeDescriptionGroup(desc)) {
          case TypeGroup.Object:
            return Object.values(desc.typeObj).filter(isUUID)
          case TypeGroup.Array:
            return desc.arrayOfTypes
        }
      })
      .reduce(
        (acc, arr) => [...acc, ...arr],
        []
      )

    const shouldDelete = idsOfAllTypes.filter(_ => _ === type).length === 1
    if (shouldDelete) {
      const i = typeDescriptions.findIndex(desc => desc.id === type)
      typeDescriptions.splice(i, 1)
    }
  })
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
          return getName(
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
        .forEach( ([key, value]) => getName(
          { rootTypeId: value, types },
          key,
          names,
          false
        ))
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

function findNameById (
  id: string,
  names: NameEntry[]
): string {
  return names.find(_ => _.id === id).name
}

function replaceTypeObjIdsWithNames (typeObj: object, names: NameEntry[]): object {
    return Object.entries(typeObj)
      .map(([key, type]) => {
        const keyWordCount = key.split(' ').length

        return keyWordCount > 1 ?
            [`'${key}'`, type] :
            [key, type]
      })
      .map(([key, type]) => {
        if (isUUID(type)) { // we only need to replace ids not primitive types
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

export function optimizeTypeStructure ({rootTypeId, types}: TypeStructure) {
  iterateRec(rootTypeId)

  function iterateRec (typeId)  {
    const typeDesc = types.find(_ => _.id === typeId)

    switch (getTypeDescriptionGroup(typeDesc)) {
      case TypeGroup.Object:
        Object.values(typeDesc.typeObj)
          .filter(isUUID)
          .forEach(iterateRec)
        break

      case TypeGroup.Array:
        typeDesc.arrayOfTypes
          .filter(isUUID)
          .forEach(iterateRec)

        if (typeDesc.arrayOfTypes.length > 1) {
          proposeRemoveTypes(typeDesc.arrayOfTypes, types)
        }
      break

    }
  }
}
