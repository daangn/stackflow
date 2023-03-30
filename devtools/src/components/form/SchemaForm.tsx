import type { JSONSchema7 } from "json-schema";
import { useState } from "react";
import ParamInput from "./ParamInput";

import * as css from "./SchemaForm.css";

// currently support only 1-depth strings
export default function NewSchemaForm({
  schema,
  params,
  onChangeParams,
}: {
  schema?: JSONSchema7;
  params: Record<string, string>;
  onChangeParams: (key: string, value: string) => void;
}) {
  const [newParam, setNewParam] = useState("");

  return (
    <div className={css.form}>
      {Object.entries(params).map(([key, value]) => {
        return (
          <div key={key}>
            <label>{key}</label>
            {schema?.required?.includes(key) && (
              <span style={{ color: "red" }}>*</span>
            )}
            <ParamInput
              type="text"
              value={value}
              onChange={(e) => {
                e.preventDefault();
                onChangeParams(key, e.target.value);
              }}
            />
          </div>
        );
      })}
      {
        // add param button
        !schema && (
          <div>
            {Object.keys(params).length === 0 && (
              <div>
                paramsSchema is not provided. Add params manually to use
                dispatcher.
              </div>
            )}

            <div className={css.paramControl}>
              <ParamInput
                type="text"
                placeholder="param"
                value={newParam}
                onChange={(e) => {
                  e.preventDefault();
                  setNewParam(e.target.value);
                }}
              />
              <button
                onClick={() => {
                  onChangeParams(newParam, "");
                  setNewParam("");
                }}
                disabled={newParam.length === 0}
              >
                Add
              </button>
            </div>
          </div>
        )
      }
    </div>
  );
}
