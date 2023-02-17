import { useReducer, useState } from "react";
import Collapse from "./Collapse";
import * as css from "./TreeView.css";

export default function TreeView({
  name,
  data,
}: {
  name?: string;
  data: unknown;
}) {
  const [opened, toggle] = useReducer((opened) => !opened, false);

  const type = Array.isArray(data) ? "array" : typeof data;
  const expandable =
    (type === "object" && Object.keys(data as object).length > 0) ||
    type === "array";

  return (
    <div className={css.container}>
      {expandable ? <Expand opened={opened} toggle={toggle} /> : <></>}
      <div>
        <div
          onClick={toggle}
          style={{
            cursor: expandable ? "pointer" : "default",
          }}
        >
          <span
            style={{
              fontWeight: "bold",
            }}
          >
            {name}
          </span>

          {!expandable && (
            <span>
              :{" "}
              <span className={css[type === "string" ? "string" : "notString"]}>
                {data + ""}
              </span>
            </span>
          )}

          <span
            style={{
              color: "gray",
            }}
          >
            {" "}
            {type}
          </span>
        </div>

        {expandable && (
          <Collapse opened={opened}>
            {Object.entries(data as object).map(([key, value]) => (
              <TreeView key={key} name={key} data={value} />
            ))}
          </Collapse>
        )}
      </div>
    </div>
  );
}

function Expand({ opened, toggle }: { opened: boolean; toggle: () => void }) {
  return (
    <div
      className={`${opened ? css.rotate : css.rotateBefore} ${css.branch}`}
      onClick={toggle}
      style={{
        cursor: "pointer",
      }}
    >
      <svg
        width="7"
        height="10"
        viewBox="0 0 15 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M15 11L0 21.3923L0 0.607696L15 11Z" fill="black" />
      </svg>
    </div>
  );
}
