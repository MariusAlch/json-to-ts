const test1 = [
  {a: 1},
  {a: 1}
]

const res1 = {
  rootTypeId: 'tipas1',
  types: [
    {
      id: 'tipas1',
      arrayOfTypes: [
        'tipas2'
      ]
    },
    {
      id: 'tipas2',
      typeObj: {
          a: 'number'
      }
    }
  ]
}

const test2 = [
  {a: 1},
  [
    {a: 1}
  ]
]

const res2 = {
  rootTypeId: 'tipas1',
  types: [
    {
      id: 'tipas1',
      arrayOfTypes: [
        'tipas2', 'tipas3'
      ]
    },
    {
      id: 'tipas2',
      typeObj: {
          a: 'number'
      }
    },
    {
      id: 'tipas3',
      arrayOfTypes: [
        'tipas2'
      ]
    }
  ]
}

const test3 = [
  {a: 1},
  [
    {a: 1},
    'marius',
    {b: 2}
  ]
]

const res3 = {
  rootTypeId: 'tipas1',
  types: [
    {
      id: 'tipas1',
      arrayOfTypes: [
        'tipas2', 'tipas3'
      ]
    },
    {
      id: 'tipas2',
      typeObj: {
          a: 'number'
      }
    },
    {
      id: 'tipas3',
      arrayOfTypes: [
        'tipas2', 'string', 'tipas4'
      ]
    },
    {
      id: 'tipas4',
      typeObj: {
          b: 'number'
      }
    }
  ]
}

const test4 = [
  {a: 1},
  [
    {a: 1},
    'marius',
    {
      b: [
        {a: 1},
        'marius',
      ]
    }
  ]
]

const res4 = {
  rootTypeId: 'tipas1',
  types: [
    {
      id: 'tipas1',
      arrayOfTypes: [
        'tipas2', 'tipas3'
      ]
    },
    {
      id: 'tipas2',
      typeObj: {
          a: 'number'
      }
    },
    {
      id: 'tipas3',
      arrayOfTypes: [
        'tipas2', 'string', 'tipas4'
      ]
    },
    {
      id: 'tipas4',
      typeObj: {
          b: 'tipas5'
      }
    },
    {
      id: 'tipas5',
      arrayOfTypes: [
        'tipas2', 'string'
      ]
    }
  ]
}

const test5 = [
  [
    [
      123
    ]
  ]
]

const res5 = {
  rootTypeId: 'tipas1',
  types: [
    {
      id: 'tipas1',
      arrayOfTypes: [
        'tipas2'
      ]
    },
    {
      id: 'tipas2',
      arrayOfTypes: [
        'tipas3'
      ]
    },
    {
      id: 'tipas3',
      arrayOfTypes: [
        'string'
      ]
    }
  ]
}