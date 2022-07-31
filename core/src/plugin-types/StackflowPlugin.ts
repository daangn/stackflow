import { PoppedEvent, PushedEvent, ReplacedEvent } from "../event-types";
import { BaseDomainEvent } from "../event-types/_base";
import {
  StackflowPluginHook,
  StackflowPluginPostEffectHook,
  StackflowPluginPreEffectHook,
} from "./StackflowPluginHook";

export type StackflowPlugin = () => {
  /**
   * Unique string value to be given as a key value when the plugin is rendered in the React Tree in the form of an array
   */
  key: string;

  /**
   * Called when the <Stack /> component is initialized for the first time
   */
  onInit?: StackflowPluginHook;

  /**
   * Called before the `pop()` function of `useActions()` is called and the corresponding signal is delivered to the core
   */
  onBeforePop?: StackflowPluginPreEffectHook<
    Omit<PoppedEvent, keyof BaseDomainEvent>
  >;

  /**
   * Called before the `push()` function of `useActions()` is called and the corresponding signal is delivered to the core
   */
  onBeforePush?: StackflowPluginPreEffectHook<
    Omit<PushedEvent, keyof BaseDomainEvent>
  >;

  /**
   * Called before the `replace()` function of `useActions()` is called and the corresponding signal is delivered to the core
   */
  onBeforeReplace?: StackflowPluginPreEffectHook<
    Omit<ReplacedEvent, keyof BaseDomainEvent>
  >;

  /**
   * Called when the push procedure is complete and the actual rendering is finished
   */
  onPushed?: StackflowPluginPostEffectHook<"PUSHED">;

  /**
   * Called when the pop procedure is complete and the actual rendering is finished
   */
  onPopped?: StackflowPluginPostEffectHook<"POPPED">;

  /**
   * Called when the replace procedure is complete and the actual rendering is finished
   */
  onReplaced?: StackflowPluginPostEffectHook<"REPLACED">;

  /**
   * Called after any changes to the stack state are reflected in the actual rendering
   */
  onChanged?: StackflowPluginPostEffectHook<"%SOMETHING_CHANGED%">;

  /**
   * Specifies the first `PushedEvent` (Overrides the `initialActivity` option specified in the `stackflow()` function)
   */
  overrideInitialPushedEvent?: (args: {
    pushedEvent: PushedEvent | null;
  }) => PushedEvent | null;
};
