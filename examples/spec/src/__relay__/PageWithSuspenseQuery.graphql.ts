/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
export type PageWithSuspenseQueryVariables = {
    id: string;
};
export type PageWithSuspenseQueryResponse = {
    readonly film: {
        readonly id: string;
    } | null;
};
export type PageWithSuspenseQuery = {
    readonly response: PageWithSuspenseQueryResponse;
    readonly variables: PageWithSuspenseQueryVariables;
};



/*
query PageWithSuspenseQuery(
  $id: ID!
) {
  film(id: $id) {
    id
  }
}
*/

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
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "concreteType": "Film",
    "kind": "LinkedField",
    "name": "film",
    "plural": false,
    "selections": [
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
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "PageWithSuspenseQuery",
    "selections": (v1/*: any*/),
    "type": "Root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "PageWithSuspenseQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "ea7b36e697deb2edc7dd246fb963b163",
    "id": null,
    "metadata": {},
    "name": "PageWithSuspenseQuery",
    "operationKind": "query",
    "text": "query PageWithSuspenseQuery(\n  $id: ID!\n) {\n  film(id: $id) {\n    id\n  }\n}\n"
  }
};
})();
(node as any).hash = '33104a28ad8cc9df8d96489f883faf4d';
export default node;
