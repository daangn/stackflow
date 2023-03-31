import { useReducer, useState } from "react";
import Collapse from "./Collapse";
import * as css from "./TreeView.css";

export default function TreeView({
  id,
  name,
  data,
  updateTree = {},
  updateFlag,
  toggleOpen,
  openTree = {},
}: {
  id: string;
  name: string;
  data: unknown;
  updateTree: Record<string, any>;
  updateFlag: boolean;
  toggleOpen: (id: string) => void;
  openTree: Record<string, any>;
}) {
  const type = Array.isArray(data) ? "array" : typeof data;
  const expandable =
    (type === "object" && Object.keys((data as object) ?? {}).length > 0) ||
    type === "array";

  const opened: boolean = openTree.$opened;

  const toggle = () => {
    toggleOpen(id);
  };

  return (
    <div className={css.container}>
      {expandable && <Expand opened={opened} toggle={toggle} />}
      <div>
        <div
          onClick={toggle}
          style={{
            cursor: expandable ? "pointer" : "default",
            display: "inline-flex",
            gap: "4px",
          }}
          className={
            updateTree.$key ? (updateFlag ? css.updated : css.updatedAgain) : ""
          }
          id={id}
        >
          <div
            style={{
              fontWeight: "bold",
            }}
          >
            {name}
            {!expandable && ":"}
          </div>

          {!expandable && (
            <div
              className={`${css[type === "string" ? "string" : "notString"]} ${
                updateTree.$value
                  ? updateFlag
                    ? css.updated
                    : css.updatedAgain
                  : ""
              }`}
            >
              {typeof data === "object" && data !== null ? "{}" : data + ""}
            </div>
          )}

          <div
            style={{
              color: "gray",
            }}
          >
            {type}
          </div>
        </div>

        {expandable && (
          <Collapse opened={opened}>
            {Object.entries(data as object).map(([key, value]) => (
              <TreeView
                id={`${id}.${key}`}
                key={key}
                name={key}
                data={value}
                updateTree={updateTree[key] ?? {}}
                updateFlag={updateFlag}
                toggleOpen={toggleOpen}
                openTree={openTree[key] ?? {}}
              />
            ))}
          </Collapse>
        )}
      </div>
    </div>
  );
}

function Expand({ opened, toggle }: { opened: boolean; toggle: () => void }) {
  return (
    <span className={css.expand} onClick={toggle}>
      <svg
        width="10"
        height="10"
        viewBox="0 0 15 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={opened ? css.rotate : css.rotateBefore}
      >
        <path d="M15 11L0 21.3923L0 0.607696L15 11Z" fill="white" />
      </svg>
    </span>
  );
}
