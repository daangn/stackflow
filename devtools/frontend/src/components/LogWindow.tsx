import { forwardRef } from "react";
import * as css from "./LogWindow.css";

const LogWindow = forwardRef<HTMLDivElement>((props, ref) => {
  const logs = [
    {
      timestamp: Intl.DateTimeFormat().format(new Date()),
      message: "This is a log 1",
    },
    {
      timestamp: Intl.DateTimeFormat().format(new Date()),
      message: "This is a log 2",
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
