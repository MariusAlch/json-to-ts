export enum TypeGroup {
  Primitive, Array, Object
}

/**
 * posible type reference values:
 * 
 * [cdfded10-4078-8359-8468-f5d9de728111, cdfded10-4078-8359-8468-84688468],
 * []
 * 'string'
 * 'cdfded10-4078-8359-8468-f5d9de728111'
 */
export type TypeReference = string[] | string

export interface TypeDescription {
  id: string
  typeObj: any
}

export interface TypesSummary {
  typeRef: TypeReference
  types: TypeDescription[]
}