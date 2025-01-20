import { createContext } from "react";
import type { ActivityComponentType } from "../stable";

type Value = {
  activityComponentMap: { [key: string]: ActivityComponentType<any> };
  set: (key: string, value: ActivityComponentType<any>) => void;
};

export const UNSAFE_ActivityComponentMapContext = createContext<Value>(
  null as any,
);

type ActivityComponentMapProviderProps = {
  value: Value;
  children: React.ReactNode;
};

export const ActivityComponentMapProvider: React.FC<
  ActivityComponentMapProviderProps
> = (props) => {
  return (
    <UNSAFE_ActivityComponentMapContext.Provider value={props.value}>
      {props.children}
    </UNSAFE_ActivityComponentMapContext.Provider>
  );
};
