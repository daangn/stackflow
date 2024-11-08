import type { Accessor } from "solid-js";
import { createEffect, createSignal } from "solid-js";

import { requestNextFrame } from "./utils";

export function createLazy<T>(value: Accessor<T>) {
  const [state, setState] = createSignal<T | undefined>(undefined);

  createEffect(() => {
    const v = value();
    requestNextFrame(() => {
      setState(() => v);
    });
  });

  return state;
}
