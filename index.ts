import {
  getTypeInfo,
  prettyPrint,
  typesSummaryIterator
} from './lib'

import {
  TypeDescription,
  TypeReference,
  TypeGroup,
  TypesSummary,
} from './model'

const test1 = {
  forest: {
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

const typesSummary = getTypeInfo(test1)

prettyPrint(typesSummary)

typesSummaryIterator(typesSummary, function (ref, name) {
  console.log(ref, name)
})
