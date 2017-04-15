import {
  getTypeGroup,
  prettyPrint,
  getIdByType,
  getSimpleTypeName,
  getTypeStructure,
  isUUID,
  getNames,
  getTypeDescriptionGroup
} from './lib'


import {
  TypeDescription,
  TypeGroup,
  TypeStructure,
  NameEntry,
  NameStructure
} from './model'

const test1 = {
  forest: {
    marius: [{a: 'b'}, {a: 'b'}],
    grass: 'green',
    age: 13,
    oak: {
      natural: false,
      name: 'good tree'
    },
    willow: {
      natural: true,
      name: 'willam'
    },
    animals: [
      { species: 'rabbit' },
      { species: 'fox' }
    ],
    humans: [{
      kas: 'tas'
    }],
    officer: null
  },
  name: 'beauty-forest'
}

interface InterfaceDescription {
  name: string
  typeMap: object
}

function findNameById (
  id: string,
  names: NameEntry[]
): string {
  return names.find(_ => _.id === id).name
}

function replaceTypeObjIdsWithNames (typeObj: Object, names: NameEntry[]): Object {
    return Object.entries(typeObj)
      .map(([key, value]) => {
        if (isUUID(value)) { // we only need to replace ids not primitive types
          const name = findNameById(value, names)
          return [key, name]
        } else {
          const entry = value === 'null' ?
                     [`${key}?`, 'any'] :
                     [   key   , value]
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

function getInterfaceDescriptions(
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

function getInterfaceStringFromDescription({name, typeMap}: InterfaceDescription): string {

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

export function jsonToTypescriptInterfaces(json: any): string[] {
  const typeStructure = getTypeStructure(json)
  // prettyPrint(typeStructure)
  const names = getNames(typeStructure)
  // prettyPrint(names)

  return getInterfaceDescriptions(typeStructure, names)
    .map(typeDesciprtion => {
      return getInterfaceStringFromDescription(typeDesciprtion)
    })
}

// jsonToTypescriptInterfaces(test1).forEach(_ => {
//   console.log(`${_}\n`)
// })
