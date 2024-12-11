import type { CoreStore, Stack } from "@stackflow/core";
import type { Accessor, Component, JSXElement } from "solid-js";
import { createContext, useTransition } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

export const CoreActionsContext = createContext<Accessor<CoreStore["actions"]>>(
  null as any,
);
export const CoreStateContext = createContext<{
  stack: Stack;
  pending: Accessor<boolean>;
}>(null as any);

export interface CoreProviderProps {
  coreStore: CoreStore;
  transition: boolean;
  children: JSXElement;
}
export const CoreProvider: Component<CoreProviderProps> = (props) => {
  const [stack, setStack] = createStore(
    JSON.parse(JSON.stringify(props.coreStore.actions.getStack())),
  );
  const [pending, startTransition] = useTransition();

  props.coreStore.subscribe(() => {
    const update = () =>
      setStack(
        reconcile(
          JSON.parse(JSON.stringify(props.coreStore.actions.getStack())),
          { merge: true },
        ),
      );
    if (props.transition) startTransition(update);
    else update();
  });

  return (
    <CoreStateContext.Provider value={{ stack, pending }}>
      <CoreActionsContext.Provider value={() => props.coreStore.actions}>
        {props.children}
      </CoreActionsContext.Provider>
    </CoreStateContext.Provider>
  );
};
