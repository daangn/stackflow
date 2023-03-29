import * as css from "./ActivityComponent.css";
import type { Activity } from "@stackflow/core";

export default function ActivityComponent({
  id,
  activity,
  onClick,
}: {
  id: string;
  activity: Activity;
  onClick: (id: string) => void;
}) {
  return (
    <a
      className={`${css.activity} ${activity.isTop ? css.top : ""} ${
        activity.exitedBy ? css.exited : ""
      }`}
      // hacky timeout to await tree height transition
      onClick={(e) => {
        onClick(activity.id);
        setTimeout(() => {
          location.hash = `#`;
          location.hash = `#Stack.activities.${id}`;
        }, 222);
      }}
    >
      <span className={activity.isTop ? "" : css.text}>{activity.name}</span>
    </a>
  );
}
