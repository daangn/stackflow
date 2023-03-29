import { forwardRef } from "react";
import useEventLogs from "../hooks/useEventLogs";
import * as css from "./LogWindow.css";
import TreeView from "./TreeView";

function formatDate(date: Date) {
  let p = new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "numeric",
    fractionalSecondDigits: 3,
  })
    .formatToParts(date)
    .reduce((acc: any, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  return `${p.year}.${p.month}.${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

const LogWindow = forwardRef<HTMLDivElement>((props, ref) => {
  const logs = useEventLogs();

  return (
    <div className={css.logWindow} ref={ref}>
      {logs.map((log) => (
        <div className={css.log} key={`${log.eventDate}#${log.name}`}>
          {"["}
          {formatDate(new Date(log.eventDate))}
          {"]"} {log.name}
        </div>
      ))}
    </div>
  );
});

export default LogWindow;
