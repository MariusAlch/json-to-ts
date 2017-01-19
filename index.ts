import {
  getTypeGroup,
  prettyPrint,
  getIdByType,
  getSimpleTypeName
} from './lib'

import {
  TypeDescription,
  TypeGroup,
  TypesSummary,
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

export function createTypeObject(obj: any, types: TypeDescription[]): any {
  return Object.entries(obj).reduce( (typeObj, [key, value]) => {
      const {rootType} = getTypeInfo(value, types)

      return {
        [key]: rootType,
        ...typeObj
      }
    },
    {}
  )
}

export function getTypeInfo(
  targetObj: any, // object that we want to create types for
  types: TypeDescription[] = [],
): TypesSummary {
  switch (getTypeGroup(targetObj)) {

    case TypeGroup.Array:
      const typesOfArray = (<any[]>targetObj)
      .map( _ => getTypeInfo(_, types).rootType)
      .filter( (id, i, arr) => arr.indexOf(id) === i)

      const arrayType = getIdByType(typesOfArray, types)

      return {
        rootType: arrayType,
        types
      }

    case TypeGroup.Object:
      const typeObj = createTypeObject(targetObj, types)
      const objType = getIdByType(typeObj, types)

      return {
        rootType: objType,
        types
      }

    case TypeGroup.Primitive:
      const simpleType = getSimpleTypeName(targetObj)

      return {
        rootType: simpleType,
        types
      }
  }
}

prettyPrint(getTypeInfo(test1))