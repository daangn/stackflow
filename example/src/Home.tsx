import { ActivityComponentType, useActivity } from "@stackflow/react";
import { AppScreen } from "@stackflow/seed-design";
import React from "react";

import { useFlow } from "./stackflow";

const Home: ActivityComponentType = () => {
  const { push, pop } = useFlow();
  const activity = useActivity();

  return (
    <AppScreen theme="cupertino" appBar={{ title: activity.id }}>
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
        {Array(1000)
          .fill("")
          .map(() => (
            <>
              break
              <br />
            </>
          ))}
      </div>
    </AppScreen>
  );
};

export default Home;
