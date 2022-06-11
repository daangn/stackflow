import { PushedEvent } from "../event-types";
import {
  StackflowPluginHook,
  StackflowPluginPostEffectHook,
  StackflowPluginPreEffectHook,
} from "./StackflowPluginHook";

export type StackflowPlugin = (args: { context: any }) => {
  key: string;
  onInit?: StackflowPluginHook;
  onBeforePop?: StackflowPluginPreEffectHook;
  onBeforePush?: StackflowPluginPreEffectHook;
  onBeforeReplace?: StackflowPluginPreEffectHook;
  onPushed?: StackflowPluginPostEffectHook<"PUSHED">;
  onPopped?: StackflowPluginPostEffectHook<"POPPED">;
  onReplaced?: StackflowPluginPostEffectHook<"REPLACED">;
  onChanged?: StackflowPluginPostEffectHook<"%SOMETHING_CHANGED%">;
  initialPushedEvent?: () => PushedEvent | null;
};
