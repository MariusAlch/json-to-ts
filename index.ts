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
    humans: [],
    officer: null
  },
  name: 'beauty-forest'
}

const test2 = [
  {a: 1},
  {b: 2},
]

const test3 = {
  name: null
}

const typeStructure = getTypeStructure(test1)
prettyPrint(typeStructure)
const names = getNames(typeStructure)
prettyPrint(names)

interface InterfaceDescription {
  name: string
  typeBlock: object
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
        const typeBlock = replaceTypeObjIdsWithNames(typeDescription.typeObj, names)
        return {name, typeBlock}
      } else {
        return null
      }

    })
    .filter(_ => _ !== null)
}


const interfaceDescriptions = getInterfaceDescriptions(typeStructure, names)

function getInterfaceStringFromDescription({name, typeBlock}: InterfaceDescription): string {

  const stringTypeMap = Object.entries(typeBlock)
    .map(([key, name]) => `  ${key}: ${name}\n`)
    .reduce( (a, b) => a += b)

  let interfaceString =  `interface ${name} {\n`
      interfaceString +=  stringTypeMap
      interfaceString += '}'


  return interfaceString
}

interfaceDescriptions.forEach(_ => {
  const interfaceString = getInterfaceStringFromDescription(_)
  console.log(interfaceString + '\n')
})