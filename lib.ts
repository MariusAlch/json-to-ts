import {
  TypeDescription,
  TypeGroup,
  TypesSummary,
  TypeReference
} from './model'

export function createTypeDescription (typeObj): TypeDescription {
  return {
    id: UUID(),
    typeObj
  }
}

export function getIdByTypeObject (typeObj: any, types: TypeDescription[]): string {
  let typeDesc = types.find(el => {
    return compareTypeObjects(el.typeObj, typeObj)
  })

  if (!typeDesc) {
    typeDesc = createTypeDescription(typeObj)
    types.push(typeDesc)
  }

  return typeDesc.id
}

export function UUID (): string {
  function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4()
}

export function compareTypeObjects (a, b): boolean {
  const entriesA = Object.entries(a)
  const entriesB = Object.entries(b)

  const sameLength = entriesA.length === entriesB.length

  const sameTypes = entriesA.every( ([key, value]) => {
    return b[key] === value
  })

  return sameLength && sameTypes
}

export function hasSamePrimitiveElements(a: any[], b: any[]) {
  return a.every( el => b.indexOf(el) !== -1)
}

export function isArray (x) {
  return Object.prototype.toString.call(x) === '[object Array]'
}

export function isObject (x) {
  return Object.prototype.toString.call(x) === '[object Object]' && x !== null
}

export function getSimpleTypeReference (value: any): TypeReference {
  if (value === null) {
    return 'null'
  } else {
    return typeof value
  }
}

export function getTypeGroup(value: any): TypeGroup {
  if (isArray(value)) {
    return TypeGroup.Array
  } else if (isObject(value)) {
    return TypeGroup.Object
  } else {
    return TypeGroup.Primitive
  }
}

export function createTypeObject(obj: any, types: TypeDescription[]): any {
  return Object.entries(obj).reduce( (typeObj, [key, value]) => {
      const {typeRef} = getTypeInfo(value, types)

      return {
        [key]: typeRef,
        ...typeObj
      }
    },
    {}
  )
}

export function getTypeInfo(value: any, types: TypeDescription[] = []): TypesSummary {
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

export function prettyPrint(json) {
  console.log(
    JSON.stringify(json, null, 4)
  )
}

export function isUUID(typeRef: TypeReference) {
  return typeof typeRef === 'string' && typeRef.length === 36
}

export function generateTypeName(str: string, index: number = 0): string {
  const postFix = index === 0 ? '' : index
  return str.charAt(0).toUpperCase() + str.slice(1) + postFix
}

export function typesSummaryIterator(
  typesSummary: TypesSummary,
  callback: (ref: string, key: string) => void
) {

  iterateTypesSummary(typesSummary, 'RootType')

  /**
   * closure uses "callback" outside function scope for eadability purposes
   */
  function iterateTypesSummary( // 
    { typeRef, types }: TypesSummary,
    keyName: string
  ) {
    switch (getTypeGroup(typeRef)) {

      case TypeGroup.Array:
        typeRef = typeRef as string[]

        typeRef.forEach( (ref, i) => {

          iterateTypesSummary(
            { typeRef: ref, types },
            keyName
          )
        })
        break

      case TypeGroup.Primitive:
        typeRef = typeRef as string
        if (isUUID(typeRef)) {

          callback(typeRef, keyName)

          const {typeObj} = types.find( _ => _.id === typeRef)

          Object.entries(typeObj).forEach( ([key, value]) => {
            iterateTypesSummary(
              { typeRef: value, types },
              key
            )
          })
        }
        break

    }
  }
}