export enum TypeGroup {
  Primitive, Array, Object
}

export interface TypeDescription {
  id: string
  typeObj?: Object
  arrayOfTypes?: string[]
}

export interface TypeStructure {
  rootTypeId: string
  types: TypeDescription[]
}

export interface NameEntry {
  id: string
  name: string
}

export interface NameStructure {
  rootName: string
  names: NameEntry[]
}