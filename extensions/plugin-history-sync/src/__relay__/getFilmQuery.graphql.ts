/**
 * @generated SignedSource<<b0104b4c0efe23959a4cbe1624e9a874>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type getFilmQuery$variables = {
  id: string;
};
export type getFilmQuery$data = {
  readonly film: {
    readonly title: string | null | undefined;
  } | null | undefined;
};
export type getFilmQuery = {
  response: getFilmQuery$data;
  variables: getFilmQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "id"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "getFilmQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Film",
        "kind": "LinkedField",
        "name": "film",
        "plural": false,
        "selections": [
          (v2/*: any*/)
        ],
        "storageKey": null
      }
    ],
    "type": "Root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "getFilmQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Film",
        "kind": "LinkedField",
        "name": "film",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "id",
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "7d37e3d8e82efb1163a686c2802d3ab8",
    "id": null,
    "metadata": {},
    "name": "getFilmQuery",
    "operationKind": "query",
    "text": "query getFilmQuery(\n  $id: ID!\n) {\n  film(id: $id) {\n    title\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "bc99d7343b0a9120103fe248e45ffe6a";

export default node;
