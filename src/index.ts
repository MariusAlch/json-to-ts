import {
  isObject,
  getTypeStructure,
  getNames,
  getInterfaceDescriptions,
  getInterfaceStringFromDescription
} from './lib'

export function jsonToTypescriptInterfaces(json: any): string[] {
  /**
   * Parsing currently works with JSON object not arrays and primitive types
   * so we shall validate, so we dont start parsing non Object type
   */
  if (!isObject(json)) {
    throw new Error('Only "object" is supported, not arrays and primitive types')
  }

  const typeStructure = getTypeStructure(json)
  const names = getNames(typeStructure)

  return getInterfaceDescriptions(typeStructure, names)
    .map(getInterfaceStringFromDescription)
}
