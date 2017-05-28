import {
  isArray,
  isObject,
  getNames,
  getInterfaceDescriptions,
  getInterfaceStringFromDescription,
  getTypeStructure
} from './lib'
import { Options, TypeDescription } from './model'
import { shim } from 'es7-shim'
import { optimizeTypeStructure } from './lib'
shim()

export function prettyPrint(arg) {
  console.log(JSON.stringify(arg, null, 2))
}

export default function JsonToTS(json: any, userOptions?: Options): string[] {
  const defaultOptions: Options = {
    rootName: 'RootObject'
  }
  const options = {
    ...defaultOptions,
    ...userOptions
  }

  /**
   * Parsing currently works with (Objects) and (Array of Objects) not and primitive types and mixed arrays etc..
   * so we shall validate, so we dont start parsing non Object type
   */
  const isArrayOfObjects = isArray(json) && json.length > 0 && json.reduce(
    (a, b) => a && isObject(b),
    true
  )

  if (!(isObject(json) || isArrayOfObjects)) {
    throw new Error('Only (Object) and (Array of Object) are supported')
  }

  const typeStructure = getTypeStructure(json)
  /**
   * due to merging array types some types are switched out for merged ones
   * so we delete the unused ones here
   */
  optimizeTypeStructure(typeStructure)

  const names = getNames(typeStructure, options.rootName)

  return getInterfaceDescriptions(typeStructure, names)
    .map(getInterfaceStringFromDescription)
}

(<any>JsonToTS).default = JsonToTS
module.exports = JsonToTS

const json = {
  hello: 'world',
  cats: [
    { fa: 'la' },
    { fa: 'la', ka: 'ta' },
  ]
}

const json2 = [
  {
    name: 'marius',
    labas: {
      name: 'mairus',
      age: 20,
      cats: {hello: 'world'}
    }
  },
  {
    dame: 'marius',
    labas: {
      name: 'mairus',
    }
  }
]

const json3 = {
  cats: [
    { age: [42]},
    { age: ['42']},
  ],
  dads: [
    'hello', 42
  ]
}

const json4 = {'items': [{'bookLater': false, 'image': {'url': '/image/6332d722-8aa3-45e3-bc5d-e762cd5b4c87'}, 'availability': 'AVAILABLE', 'id': '5932efea-8230-431f-9720-473f967213c0', 'preliminaryPrice': 0.00, 'pickup': {'usePickup': false, 'useDropoff': false}, 'plannableId': '68fdb213-b86f-4c0b-a7fb-f5b557ede775', 'contentProvider': 'PLACES', 'extras': {'hasBookableExtras': false}, 'travelers': {'adults': 2, 'rooms': 1, 'children': 0, 'childrenAges': []}, 'title': 'Capitoline Hill', 'type': 'POI', 'billables': [{'quantity': 2, 'price': 0.00}], 'period': {'start': 1498572600000, 'finish': 1498579800000}, 'days': 1, 'booking': {'booked': false, 'confirmed': false, 'paymentMeans': 'FREE'}}, {'bookLater': false, 'image': {'url': '/image/7a28b0bf-e0b4-4cc2-a586-1d506d3e94d4'}, 'availability': 'AVAILABLE', 'rooms': [], 'id': 'f573138c-023c-4bb6-8c9a-d8e53e43024a', 'preliminaryPrice': 90.00, 'pickup': {'usePickup': false, 'useDropoff': false}, 'checkinDate': 1498521600000, 'plannableId': 'e90ba3f9-be79-4fea-9a40-c77e5e7cc5b0', 'contentProvider': 'BOOKING_COM', 'extras': {'hasBookableExtras': false}, 'title': 'B&B Les Suites', 'type': 'ACCOMMODATION', 'billables': [{'quantity': 1, 'price': 90.00}], 'period': {'start': 1498590000000, 'finish': 1498644000000}, 'days': 1, 'booking': {'booked': false, 'confirmed': false, 'paymentMeans': 'ONLINE'}, 'checkoutDate': 1498608000000}], 'preliminaryPrice': 90.00}

JsonToTS(json4).forEach(_ => console.log(_))