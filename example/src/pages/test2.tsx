import React from "react";
import { Layout, Link } from "@daangn/react-swiper-webview";

interface Props {}

const Test2Page: React.FC<Props> = () => {
  return (
    <Layout title="/test2 page">
      <div style={{ height: "200vh" }}>
        <br />
        <Link to="/id/1">Go to id page</Link>
      </div>
    </Layout>
  );
};

export default React.memo(Test2Page);
