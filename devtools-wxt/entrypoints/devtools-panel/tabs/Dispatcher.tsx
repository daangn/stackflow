// push, pop command

import { useEffect, useMemo, useRef, useState } from "react";
import type { DevtoolsDataStore } from "@stackflow/plugin-devtools";
import { RegisteredActivity } from "@stackflow/core";

import type { JSONSchema7 } from "json-schema";
import NewSchemaForm from "../components/form/SchemaForm";
import ActionButton, { ActionType } from "../components/form/ActionButton";

import * as css from "./Dispatcher.css";

// time travel (restore stack)

export default function DispatcherTab() {
  const [activityName, setActivityName] = useState("");

  const registeredActivities = useRef<RegisteredActivity[]>([]);

  const schema = registeredActivities.current.find(
    (activity) => activity.name === activityName,
  )?.paramsSchema;

  const props = (schema as JSONSchema7)?.properties ?? {};

  const [params, setParams] = useState<Record<string, {}>>({});

  useEffect(() => {
    chrome.devtools.inspectedWindow.eval(
      `window.__STACKFLOW_DEVTOOLS__.data.stack.registeredActivities`,
      (result: DevtoolsDataStore["stack"]["registeredActivities"]) => {
        setActivityName(result[0].name);
        registeredActivities.current = result;

        setParams(
          result.reduce((acc: Record<string, {}>, activity) => {
            acc[activity.name] = {
              // @ts-ignore
              ...Object.keys(activity.paramsSchema?.properties ?? {}).reduce(
                (acc, key) => {
                  // @ts-ignore
                  acc[key] = "";
                  return acc;
                },
                {},
              ),
            };
            return acc;
          }, {}),
        );
      },
    );
  }, []);

  return (
    <div className={css.dispatcher}>
      {registeredActivities.current.length > 0 ? (
        <div className={css.items}>
          <div>
            {
              <select
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                className={css.select}
              >
                {registeredActivities.current.map((activity) => (
                  <option
                    key={activity.name}
                    value={activity.name}
                    className={css.option}
                  >
                    {activity.name}
                  </option>
                ))}
              </select>
            }
          </div>

          <NewSchemaForm
            schema={schema}
            params={params[activityName]}
            onChangeParams={(param, value) => {
              setParams(() => {
                return {
                  ...params,
                  [activityName]: {
                    ...params[activityName],
                    [param]: value,
                  },
                };
              });
            }}
          />
          <div className={css.actions}>
            {["push", "pop", "replace"].map((action) => (
              <ActionButton
                type={action as ActionType}
                params={params[activityName]}
                activityName={activityName}
                key={action}
              />
            ))}
          </div>
        </div>
      ) : (
        <div>No activity registered</div>
      )}
    </div>
  );
}
