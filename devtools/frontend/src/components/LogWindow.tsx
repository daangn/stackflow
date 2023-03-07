import { forwardRef } from "react";
import * as css from "./LogWindow.css";

const formatDate = (date: Date) => {
  return Intl.DateTimeFormat(undefined, {
    timeStyle: "medium",
  }).format(date);
};

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
