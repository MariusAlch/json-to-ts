import { InterfaceDescription, NameEntry, TypeStructure, KeyMetaData } from './model'
import { isHash, findTypeById } from './util'

function isKeyNameValid(keyName: string) {
  const regex = /^[a-zA-Z_][a-zA-Z\d_]*$/
  return regex.test(keyName)
}


function parseKeyMetaData(key: string): KeyMetaData {
  const isOptional = key.endsWith('--?')

  if (isOptional) {
    return {
      isOptional,
      keyValue: key.slice(0, -3)
    }
  } else {
    return {
      isOptional,
      keyValue: key
    }
  }

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
        const {isOptional, keyValue} = parseKeyMetaData(key)
        const isValid = isKeyNameValid(keyValue)

        const validName = isValid ? keyValue : `'${keyValue}'`

        return isOptional  ?
            [`${validName}?`, type, isOptional] :
            [validName, type, isOptional]
      })
      .map(([key, type, isOptional]) => {
        if (isHash(type)) { // we only need to replace ids not primitive types
          const name = findNameById(type, names)
          return [key, name]
        } else {
          const newType = type === 'null' ? 'any' : type
          const newKey  = type === 'null' && !isOptional ? // if null and not already optional
           `${key}?` : key

          return [newKey, newType]
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

export function getInterfaceDescriptions(
  typeStructure: TypeStructure,
  names: NameEntry[]
): InterfaceDescription[] {

  return names
    .map(({id, name}) => {
      const typeDescription = findTypeById(id, typeStructure.types)

      if (typeDescription.typeObj) {
        const typeMap = replaceTypeObjIdsWithNames(typeDescription.typeObj, names)
        return {name, typeMap}
      } else {
        return null
      }

    })
    .filter(_ => _ !== null)
}
