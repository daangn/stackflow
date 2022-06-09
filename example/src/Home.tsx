import { ActivityComponentType, useActivity } from "@stackflow/react";
import { AppScreen } from "@stackflow/ui";
import React from "react";

import { useFlow } from "./stackflow";

const Home: ActivityComponentType = () => {
  const { push, pop } = useFlow();
  const activity = useActivity();

  return (
    <AppScreen
      theme="cupertino"
      appBar={{
        onClose() {
          console.log("Close");
        },
        closeButtonLocation: "left",
        // customBackButton() {
        //   return <div>back</div>;
        // },
        // customCloseButton() {
        //   return <div>close!</div>;
        // },
        // appendLeft() {
        //   return <div>left</div>;
        // },
        // appendRight() {
        //   return <div>right!</div>;
        // },
        title: activity.name,
      }}
    >
      <div>
        name: Home, state: {activity.transitionState}{" "}
        <button
          type="button"
          onClick={() => {
            push("Home", {});
          }}
        >
          Home
        </button>
        <button
          type="button"
          onClick={() => {
            push("Article", {
              articleId: "123",
              referrer: "home",
            });
          }}
        >
          Article
        </button>
        <button
          type="button"
          onClick={() => {
            pop();
          }}
        >
          Go Back
        </button>
      </div>
    </AppScreen>
  );
};

export default Home;
