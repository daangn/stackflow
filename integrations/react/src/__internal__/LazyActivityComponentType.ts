import type { StaticActivityComponentType } from "./StaticActivityComponentType";

export type LazyActivityComponentType<T extends { [K in keyof T]: any } = {}> =
  React.LazyExoticComponent<StaticActivityComponentType<T>> & {
    _stackflow?: {
      type: "lazy";
      load: () => Promise<{ default: StaticActivityComponentType<T> }>;
    };
  };
