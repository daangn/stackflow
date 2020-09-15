import React from "react";
import {
  useSwiper,
  useIsActivePage,
  Layout,
  Link,
} from "@daangn/react-swiper-webview";

const DisabledPage: React.FC = () => {
  const { setDisable } = useSwiper();
  const isActive = useIsActivePage();

  React.useEffect(() => {
    isActive ? setDisable(true) : setDisable(false);
  }, [isActive, setDisable]);

  return (
    <Layout title="Disabled Page">
      <>
        <div style={{ height: "200vh" }}>
          <h1>스와이프 백이 불가능한 페이지 입니다.</h1>
          <Link to="/test2">Go to test2 page</Link>
          <br />
          <br />
        </div>
      </>
    </Layout>
  );
};

export default React.memo(DisabledPage);
