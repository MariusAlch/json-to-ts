import {
  compareByTypes,
  findIdByType,
  guid,
  isAdvancedType,
  isArray,
  isObjectLiteral,
  TypeDescription,
  TypeReference,
  createTypeDescription
} from './lib'

// TODO: array possible different types
// TODO: possible empty array
// TODO: ahndle null values currenty isObject(null) === true

const marius = {
  m: {
    c: 'd',
    e: 13,
    l: {
      w: false,
      q: 'la'
    },
    abc: {
      w: true,
      q: 'ladasd'
    },
    arr: [
      { a: 'b' },
      { a: 'b' }
    ]
  },
  b: 'a'
}

function getFlatTypeDefinition(value: any, types: TypeDescription[]): { typeRef: TypeReference | string, types: TypeDescription[] } {
  if (isAdvancedType(value)) {

    let arrFlag = false
    let typeObj

    if (isArray(value)) {
      typeObj = getTypeInfo(value[0], types).typeObj
      arrFlag = true
    } else if (isObjectLiteral(value)) {
      typeObj = getTypeInfo(value, types).typeObj
    }

    let id = findIdByType(typeObj, types)

    return {
      typeRef: {
        id,
        array: arrFlag,
      },
      types
    }
  } else {
    return {
      typeRef: typeof value,
      types
    }
  }
}

function getTypeInfo (obj, types?: TypeDescription[]): {typeObj: any, types: TypeDescription[]} {
  // already defined type for reuseing if possible
  types = types || [];

  // current obj type info (filled in entries for each loop)
  let typeObj = {};

  // go through key value pair and identify (create of reuse) type for value
  Object.entries(obj).forEach( ([key, value]) => {
    const {typeRef: t, types: newTypes} = getFlatTypeDefinition(value, types);
    typeObj[key] = t;
    types = newTypes;
  })

  return {
    typeObj,
    types
  }
}

console.log(getTypeInfo(marius))
