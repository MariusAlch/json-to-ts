# Json to Typescript

### Convert json object to typescript interfaces

# Example

### Code

```javascript
const jsonToTypescript = require('json-to-typescript')

const json = {
  cats: [
    {name: 'Kittin'},
    {name: 'Mittin'},
  ],
  favoriteNumber: 42,
  favoriteWord: 'Hello'
}

jsonToTypescript(json).forEach( typeInterface => {
  console.log(typeInterface)
})
```

### Output:

```typescript
interface RootObject {
  cats: Cat[];
  favoriteNumber: number;
  favoriteWord: string;
}
interface Cat {
  name: string;
}
```

# Setup

```sh
$ npm install --save json-to-typescript
```
