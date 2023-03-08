import { forwardRef } from "react";
import * as css from "./LogWindow.css";

function formatDate(date: Date) {
  let p = new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .formatToParts(date)
    .reduce((acc: any, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  return `${p.year}.${p.month}.${p.day} ${p.hour}:${p.minute} ${p.}`;
}

const LogWindow = forwardRef<HTMLDivElement>((props, ref) => {
  const logs = [
    {
      timestamp: formatDate(new Date()),
      message: "PushedEvent",
    },
    {
      timestamp: formatDate(new Date()),
      message: "ReplacedEvent",
    },
  ];

  return (
    <div className={css.logWindow} ref={ref}>
      {logs.map((log) => (
        <div className={css.log} key={log.message}>
          {"["}
          {log.timestamp}
          {"]"} {log.message}
        </div>
      ))}
    </div>
  );
});

export default LogWindow;
