import type { ActivityComponentType } from "./ActivityComponentType";

export type LazyActivityComponentType<T extends { [K in keyof T]: any } = {}> =
  React.LazyExoticComponent<ActivityComponentType<T>> & {
    _stackflow?: {
      type: "lazy";
      load: () => Promise<{ default: ActivityComponentType<T> }>;
    };
  };
