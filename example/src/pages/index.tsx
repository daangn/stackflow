import React from "react";
import { Layout, Link } from "@daangn/react-swiper-webview";

interface Props {}

const RootPage: React.FC<Props> = () => {
  return (
    <Layout title="Root Page">
      <div style={{ height: "200vh" }}>
        <br />
        <Link to="/disabled">Go to swipe disabled page</Link>
      </div>
    </Layout>
  );
};

export default React.memo(RootPage);
