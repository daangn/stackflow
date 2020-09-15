import React from 'react';
import { useMatch, Layout, Link } from '@daangn/react-swiper-webview';

const IdPage: React.FC = () => {
  const {
    params: { id },
  } = useMatch();

  return (
    <Layout title="ID Page">
      <>
        <div style={{ height: "200vh" }}>
          <br />
          <Link to={`/id/${+id + 1}`}>GO TO {+id + 1}</Link>
          <br />
        </div>
      </>
    </Layout>
  );
};

export default React.memo(IdPage);
