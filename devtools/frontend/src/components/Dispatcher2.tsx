import { RegisteredActivity } from "@stackflow/core";
import Ajv, { AnySchema } from "ajv";
import { useMemo, useState } from "react";
import { JSONSchemaBridge } from "uniforms-bridge-json-schema";
import { AutoForm } from "uniforms-semantic";

const schema: AnySchema = {
  title: "Guest",
  type: "object",
  properties: {
    firstName: { type: "string" },
    lastName: { type: "number" },
    haha: { type: "boolean" },
    workExperience: {
      description: "Work experience in years",
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
  },
  required: ["firstName"],
};

const ajv = new Ajv({
  allErrors: true,
  useDefaults: true,
  keywords: ["uniforms"],
});

function createValidator(schema: AnySchema) {
  const validator = ajv.compile(schema);

  return (model: Record<string, unknown>) => {
    validator(model);
    return validator.errors?.length ? { details: validator.errors } : null;
  };
}

const schemaValidator = createValidator(schema);

const bridge = new JSONSchemaBridge(schema, schemaValidator);

export default function Dispatcher2({
  registeredActivities,
}: {
  registeredActivities: RegisteredActivity[];
}) {
  const [activityName, setActivityName] = useState(
    registeredActivities[0].name,
  );

  console.log("activityName:", activityName);

  // const bridge = useMemo(() => {
  //   const schema =
  //     registeredActivities.find((activity) => activity.name)?.paramsSchema ??
  //     {};

  //   const validator = createValidator(schema);

  //   return new JSONSchemaBridge(schema, validator);
  // }, [activityName]);

  console.log("bridge:", bridge);

  return (
    <>
      <select
        value={activityName}
        onChange={(e) => setActivityName(e.target.value)}
      >
        {registeredActivities.map((activity) => (
          <option key={activity.name} value={activity.name}>
            {activity.name}
          </option>
        ))}
      </select>
      <AutoForm schema={bridge} onSubmit={console.log} />
    </>
  );
}
