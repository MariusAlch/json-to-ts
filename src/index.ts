import {
  isObject,
  getTypeStructure,
  getNames,
  getInterfaceDescriptions,
  getInterfaceStringFromDescription,
  optimizeTypeStructure
} from './lib'

export default function jsonToTypescript(json: any): string[] {
  /**
   * Parsing currently works with JSON object not arrays and primitive types
   * so we shall validate, so we dont start parsing non Object type
   */
  if (!isObject(json)) {
    throw new Error('Only "object" is supported, not arrays and primitive types')
  }

  const typeStructure = getTypeStructure(json)
  /**
   * TO CHANGE IN THE FUTURE
   * due to optimizations some types are will be left unused
   * so delete them here
   */
  optimizeTypeStructure(typeStructure)
  const names = getNames(typeStructure)

  return getInterfaceDescriptions(typeStructure, names)
    .map(getInterfaceStringFromDescription)
}

(<any>jsonToTypescript).default = jsonToTypescript
module.exports = jsonToTypescript;