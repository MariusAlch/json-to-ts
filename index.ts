import {
  getTypeGroup,
  prettyPrint,
  getIdByType,
  getSimpleTypeName,
  getTypeStructure,
  isUUID,
  getNameStructure
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


const typeStructure = getTypeStructure(test2)
prettyPrint(typeStructure)
const {rootName, names} = getNameStructure(typeStructure)
prettyPrint(names)


