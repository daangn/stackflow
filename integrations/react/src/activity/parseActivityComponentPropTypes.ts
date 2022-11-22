import parsePropTypes from "parse-prop-types";

import type { ActivityComponentType } from "./ActivityComponentType";

export function parseActivityComponentPropTypes(
  ActivityComponent: ActivityComponentType,
) {
  const propTypes = parsePropTypes(ActivityComponent) as {
    params: {
      type: {
        name: "shape";
        value: {
          [key: string]: {
            type:
              | {
                  name: "string";
                }
              | {
                  name: "oneOf";
                  value: string[];
                };
            required?: boolean;
          };
        };
      };
    };
  };

  try {
    return {
      type: "object" as const,
      properties: Object.entries(propTypes.params.type.value).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: {
            type: "string" as const,
            ...(value.type.name === "oneOf"
              ? {
                  enum: value.type.value,
                }
              : null),
          },
        }),
        {},
      ),
      required: Object.entries(propTypes.params.type.value)
        .filter(([, value]) => value.required)
        .map(([key]) => key),
    };
  } catch (error) {
    return null;
  }
}
