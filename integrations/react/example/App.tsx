import React, { useState } from "react";

import { useCore } from "./core";

let activityIdCnt = 0;

const App: React.FC = () => {
  const { aggregateOutput, dispatchEvent } = useCore();

  const [newActivityName, setNewActivityName] = useState("");
  const [registeredActivityNames, setRegisteredActivityNames] = useState<
    string[]
  >([]);

  return (
    <div>
      <div>
        <input
          type="text"
          value={newActivityName}
          onChange={(e) => setNewActivityName(e.target.value)}
        />
        <button
          type="button"
          onClick={() => {
            if (newActivityName === "") {
              return;
            }

            dispatchEvent("ActivityRegistered", {
              activityName: newActivityName,
            });
            setNewActivityName("");
            setRegisteredActivityNames((prev) => [...prev, newActivityName]);
          }}
        >
          register Activity
        </button>
      </div>
      <div>
        {registeredActivityNames.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              activityIdCnt += 1;

              dispatchEvent("Pushed", {
                activityId: activityIdCnt.toString(),
                activityName: name,
              });
            }}
          >
            {name} push!
          </button>
        ))}
      </div>
      <div>
        <button
          type="button"
          onClick={() => {
            dispatchEvent("Popped", {});
          }}
        >
          pop
        </button>
      </div>
      <code style={{ whiteSpace: "pre" }}>
        {JSON.stringify(aggregateOutput, null, 2)}
      </code>
    </div>
  );
};

export default App;
