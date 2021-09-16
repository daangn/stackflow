import React from 'react'
import { graphql, useLazyLoadQuery } from 'react-relay'

import { useParams } from '@karrotframe/navigator'

import { PageWithSuspenseQuery } from '../../__relay__/PageWithSuspenseQuery.graphql'

const PageWithSuspense: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>()

  const query = useLazyLoadQuery<PageWithSuspenseQuery>(
    graphql`
      query PageWithSuspenseQuery($id: ID!) {
        film(id: $id) {
          id
        }
      }
    `,
    {
      id: movieId!,
    }
  )

  return <div>{query.film?.id}</div>
}

export default PageWithSuspense
