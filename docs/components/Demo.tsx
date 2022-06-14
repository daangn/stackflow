import React from "react";

const Demo: React.FC = () => (
  <div
    style={{
      position: "relative",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      margin: "3rem 0",
    }}
  >
    <iframe
      title="Stackflow Demo"
      src="https://stackflow-demo.pages.dev/?theme=cupertino"
      style={{
        width: "100%",
        maxWidth: "360px",
        height: "640px",
        boxShadow: "0 .25rem 1rem 0 rgba(0, 0, 0, .1)",
        borderRadius: ".5rem",
      }}
    />
  </div>
);

export default Demo;
