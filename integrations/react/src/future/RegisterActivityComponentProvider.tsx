import { createContext } from "react";
import type { ActivityComponentType } from "../stable";

export type RegisterActivityComponentFn = (args: {
  activityName: string;
  Component: ActivityComponentType<any>;
}) => void;

export const UNSAFE_RegisterActivityComponentContext =
  createContext<RegisterActivityComponentFn>(null as any);

type RegisterActivityComponentProviderProps = {
  value: RegisterActivityComponentFn;
  children: React.ReactNode;
};

export const RegisterActivityComponentProvider: React.FC<
  RegisterActivityComponentProviderProps
> = (props) => {
  return (
    <UNSAFE_RegisterActivityComponentContext.Provider value={props.value}>
      {props.children}
    </UNSAFE_RegisterActivityComponentContext.Provider>
  );
};
