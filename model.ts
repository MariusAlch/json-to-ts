export enum TypeGroup {
  Primitive, Array, Object
}

export interface TypeDescription {
  id: string
  typeObj?: any
  arrayOfTypes?: any
}

export interface TypesSummary {
  rootType: string
  types: TypeDescription[]
}