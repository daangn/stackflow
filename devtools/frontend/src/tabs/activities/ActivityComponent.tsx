import * as css from "./ActivityComponent.css";
import type { Activity } from "@stackflow/core";

export default function ActivityComponent({
  activity,
  onClick,
}: {
  activity: Activity;
  onClick: (id: string) => void;
}) {
  return (
    <div
      className={`${css.activity} ${activity.isTop ? css.top : ""} ${
        activity.exitedBy ? css.exited : ""
      }`}
      onClick={() => onClick(activity.id)}
    >
      <span className={activity.isTop ? "" : css.text}>
        {activity.id}: {activity.name}
      </span>
    </div>
  );
}
