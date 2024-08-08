import { Environment, Network, RecordSource, Store } from "relay-runtime";

const SWAPI_GRAPHQL_ENDPOINT =
  "https://swapi-graphql.netlify.app/.netlify/functions/index";

export function makeRelayEnvironment() {
  const network = Network.create(async (request, variables) => {
    const headers = new Headers();
    headers.set("Content-Type", "application/json");

    const json = await fetch(SWAPI_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        operationName: request.name,
        query: request.text,
        variables,
      }),
    }).then((response) => response.json());

    return json;
  });

  const store = new Store(new RecordSource());

  const environment = new Environment({
    network,
    store,
  });

  return environment;
}
