const INITIAL_SCHEMA = `// you could switch file extension to '.json' after removing every comment here
{
  "name": "",                  // declare sdk name
  "description": "",           // describe a role or a goal for sdk
  "author": "",                // author who would be responsible for this schema 
  // "endpoint": "",           // declare only an url text if you need just one endpoint and then remove "endpoints" field
  "endpoints": {               // you could have 'key' which means environment
    "prod": ""                 // and then you could have 'value' which means target url.
  },                           // note that endpoint will be ignored if you declare endpoint and endpoints both
  "version": 1,                // version for sdk
  "routes": [
    {
      "name": "",              // method name for route
      "path": "",              // declare path to route and note that params would be first parameter as object of method
      "description": "",       // describe a role or a goal for route
      "queryParams": {
        "type": "object",
        "properties": {
          "foo": {             // declare name for query params and note that you will have second object with this field
            "type": "string",  // declare type for query params. It could be string or number, object
            "description": "", // describe a role or a goal for query params
            // "enum": ["bar"] // you could also declare enum field if you need
          }
        },
        "required": ["foo"],   // you could also declare required field if certain field should be non-nullable parameter
        "additionalProperties": false // you should declare this if you do not need any query params. IT WOULD BE FIXED SOON.
      }
    }
  ]
}`

const INITIAL_CONFIG = `{
  "source": "./schema.json5",
  "output": "./sdk",
  "suffix": "sdk",
  "replace": null
}
  `

export { INITIAL_CONFIG, INITIAL_SCHEMA }
