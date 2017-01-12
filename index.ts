import {
  getIdByTypeObject,
  guid,
  isArray,
  isObject,
  TypeDescription,
  TypeReference,
  createTypeDescription,
  getSimpleTypeReference,
  getTypeGroup,
  TypeGroup
} from './lib'

const test1 = {
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
    ],
    emptyArr: [],
    shit: null
  },
  b: 'a'
}

function createTypeObject(obj: any, types: TypeDescription[]): any {
  return Object.entries(obj).reduce( (typeObj, [key, value]) => {
      const {typeRef} = getTypeInfo(value, types);
      
      return {
        [key]: typeRef,
        ...typeObj
      }
    },
    {}
  )
}

function getTypeInfo(value: any, types: TypeDescription[] = []): { typeRef: TypeReference, types: TypeDescription[] } {
  switch (getTypeGroup(value)) {

    case TypeGroup.Array:
      const ids = value
        .map(el => getTypeInfo(el, types).typeRef)
        .filter( (id, i, arr) => arr.indexOf(id) === i)

      return {
        typeRef: ids,
        types
      }

    case TypeGroup.Object:
      const typeObj = createTypeObject(value, types)
      const id = getIdByTypeObject(typeObj, types)

      return {
        typeRef: id,
        types
      }

    case TypeGroup.Primitive:
      const typeRef = getSimpleTypeReference(value)

      return {
        typeRef,
        types
      }

  }
}

console.log(JSON.stringify(
    getTypeInfo(test1),
    null,
    4
))