import React from "react";

import * as Stackflow from "../src";

const somethingPlugin = (): Stackflow.PluginType => ({
  render({ activities }) {
    return (
      <div>
        {activities.map((activity) => (
          <React.Fragment key={activity.id}>{activity.render()}</React.Fragment>
        ))}
      </div>
    );
  },
  wrapActivity({ activity }) {
    return <div>{activity.render()}</div>;
  },
});

const Hello: Stackflow.ActivityComponentType<{ world: "levi!" }> = () => (
  <div />
);

const { useFlow } = Stackflow.config({
  activities: {
    Hello,
  },
});

const { push } = useFlow();

push("Hello", {
  params: {
    world: "levi!",
  },
});
