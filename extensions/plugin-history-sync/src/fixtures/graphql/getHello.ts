import { graphql } from "relay-runtime";

try {
  const QUERY = graphql`
    query getHelloQuery {
      hello
    }
  `;
} catch {}
