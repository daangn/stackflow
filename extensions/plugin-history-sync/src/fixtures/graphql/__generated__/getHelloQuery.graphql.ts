/**
 * @generated SignedSource<<8ccc4fe13f5e55ac84f111b69b313477>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type getHelloQuery$variables = Record<PropertyKey, never>;
export type getHelloQuery$data = {
  readonly hello: string;
};
export type getHelloQuery = {
  response: getHelloQuery$data;
  variables: getHelloQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "hello",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "getHelloQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "getHelloQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "7034838ce1517428b2ca4cbf4cf17e8d",
    "id": null,
    "metadata": {},
    "name": "getHelloQuery",
    "operationKind": "query",
    "text": "query getHelloQuery {\n  hello\n}\n"
  }
};
})();

(node as any).hash = "9600d04c673acd6b58af5584b85c5779";

export default node;
