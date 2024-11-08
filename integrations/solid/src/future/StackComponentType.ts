import type { Component } from "solid-js";

export type StackComponentType = Component<{
  initialContext?: any;
  initialLoaderData?: any;
  transition?: boolean;
}>;
