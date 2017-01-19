import {
  TypeDescription,
  TypeGroup,
  TypesSummary
} from './model'

export function createTypeDescription (typeObj: any | string[]): TypeDescription {
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

export function getIdByType (typeObj: any | string[], types: TypeDescription[]): string {

  let typeDesc = types.find(el => {
    return typeObjectMatchesTypeDesc(typeObj, el)
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

export function typeObjectMatchesTypeDesc (typeObj: any | string[], typeDesc: TypeDescription): boolean {

  if (isArray(typeObj)) {
    return arraysContainSameElements(typeObj, typeDesc.arrayOfTypes)
  } else {
    return objectsHaveSameEntries(typeObj, typeDesc.typeObj)
  }

}

function arraysContainSameElements(arr1: any[], arr2: any[]): boolean {
  if (arr1 === undefined || arr2 === undefined) return false

  const filteredArray = arr1.filter( value => {
      return arr2.indexOf(value) > -1
  })

  return filteredArray.length === arr1.length
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

export function hasSamePrimitiveElements(a: any[], b: any[]) {
  return a.every( el => b.indexOf(el) !== -1)
}

export function isArray (x) {
  return Object.prototype.toString.call(x) === '[object Array]'
}

export function isObject (x) {
  return Object.prototype.toString.call(x) === '[object Object]' && x !== null
}

export function getSimpleTypeName (value: any): string {
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
export function prettyPrint(json) {
  console.log(
    JSON.stringify(json, null, 4)
  )
}

export function generateTypeName(str: string, index: number = 0): string {
  const postFix = index === 0 ? '' : index
  return str.charAt(0).toUpperCase() + str.slice(1) + postFix
}

// export function isUUID(typeRef: TypeReference) {
//   return typeof typeRef === 'string' && typeRef.length === 36
// }

// export function typesSummaryIterator(
//   typesSummary: TypesSummary,
//   callback: (ref: string, key: string) => void
// ) {

//   iterateTypesSummary(typesSummary, 'RootType')

//   /**
//    * closure uses "callback" outside function scope for eadability purposes
//    */
//   function iterateTypesSummary( // 
//     { typeRef, types }: TypesSummary,
//     keyName: string
//   ) {
//     switch (getTypeGroup(typeRef)) {

//       case TypeGroup.Array:
//         typeRef = typeRef as string[]

//         typeRef.forEach( (ref, i) => {

//           iterateTypesSummary(
//             { typeRef: ref, types },
//             keyName
//           )
//         })
//         break

//       case TypeGroup.Primitive:
//         typeRef = typeRef as string
//         if (isUUID(typeRef)) {

//           callback(typeRef, keyName)

//           const {typeObj} = types.find( _ => _.id === typeRef)

//           Object.entries(typeObj).forEach( ([key, value]) => {
//             iterateTypesSummary(
//               { typeRef: value, types },
//               key
//             )
//           })
//         }
//         break

//     }
//   }
// }