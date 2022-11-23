import React, { useEffect, useState } from "react";

export const useSyncExternalStore: typeof React.useSyncExternalStore =
  React.useSyncExternalStore ??
  ((subscribe, getSnapshot) => {
    const [state, setState] = useState(() => getSnapshot());

    useEffect(() => {
      const dispose = subscribe(() => {
        setState(() => getSnapshot());
      });

      return dispose;
    });

    return state;
  });
