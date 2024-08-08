import { graphql } from "relay-runtime";

try {
  const QUERY = graphql`
    query getFilmQuery($id: ID!) {
      film(id: $id) {
        title
      }
    }
  `;
} catch {}
