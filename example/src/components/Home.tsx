import { ActivityComponentType, useActivity } from "@stackflow/react";
import React from "react";

import MainLayout from "../layouts/MainLayout";
import { useFlow } from "../stackflow";

const Home: ActivityComponentType = () => {
  const { push, pop } = useFlow();
  const activity = useActivity();

  return (
    <MainLayout>
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
    </MainLayout>
  );
};

export default Home;
