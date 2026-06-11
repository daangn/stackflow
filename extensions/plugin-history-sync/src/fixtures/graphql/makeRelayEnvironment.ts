import fs from "node:fs";
import path from "node:path";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { graphql } from "graphql";
import { Environment, Network, RecordSource, Store } from "relay-runtime";

export function makeRelayEnvironment() {
  const schema = makeExecutableSchema({
    typeDefs: fs.readFileSync(
      path.resolve("./src/fixtures/graphql/schema.graphql"),
      "utf-8",
    ),
    resolvers: {
      Query: {
        hello: () => "world",
      },
    },
  });

  const network = Network.create(async (request, variables) => {
    const headers = new Headers();
    headers.set("Content-Type", "application/json");

    const json: any = await graphql({
      schema,
      operationName: request.name,
      source: request.text!,
      variableValues: variables,
    });

    return json;
  });

  const store = new Store(new RecordSource());

  const environment = new Environment({
    network,
    store,
  });

  return environment;
}
