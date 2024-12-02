import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { Component } from "solid-js";

export type ActivityComponentType<ActivityName extends RegisteredActivityName> =
  Component<{ params: InferActivityParams<ActivityName> }>;
