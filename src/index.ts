import {
  isObject,
  getTypeStructure,
  getNames,
  getInterfaceDescriptions,
  getInterfaceStringFromDescription,
  optimizeTypeStructure
} from './lib'
import { Options } from './model';

export default function JsonToTS(json: any, userOptions?: Options): string[] {
  const defaultOptions: Options = {
    rootName: 'RootObject'
  }
  const options = {
    ...defaultOptions,
    ...userOptions
  }

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
  const names = getNames(typeStructure, options.rootName)

  return getInterfaceDescriptions(typeStructure, names)
    .map(getInterfaceStringFromDescription)
}

(<any>JsonToTS).default = JsonToTS
module.exports = JsonToTS;