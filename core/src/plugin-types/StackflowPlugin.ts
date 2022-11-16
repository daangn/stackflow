import type {
  NestedPoppedEvent,
  NestedPushedEvent,
  NestedReplacedEvent,
  PoppedEvent,
  PushedEvent,
  ReplacedEvent,
} from "../event-types";
import type { BaseDomainEvent } from "../event-types/_base";
import type {
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
   * Called before the `pop()` function of `useActions()` is called and the corresponding signal is delivered to the core
   */
  onBeforePop?: StackflowPluginPreEffectHook<
    Omit<PoppedEvent, keyof BaseDomainEvent>
  >;

  /**
   * Called before the `nestedPush()` function of `useNestedActions()` is called and the corresponding signal is delivered to the core
   */
  onBeforeNestedPush?: StackflowPluginPreEffectHook<
    Omit<NestedPushedEvent, keyof BaseDomainEvent>
  >;

  /**
   * Called before the `nestedReplace()` function of `useNestedAction()` is called and the corresponding signal is delivered to the core
   */
  onBeforeNestedReplace?: StackflowPluginPreEffectHook<
    Omit<NestedReplacedEvent, keyof BaseDomainEvent>
  >;

  /**
   * Called before the `nestedPop()` function of `useNestedActions()` is called and the corresponding signal is delivered to the core
   */
  onBeforeNestedPop?: StackflowPluginPreEffectHook<
    Omit<NestedPoppedEvent, keyof BaseDomainEvent>
  >;

  /**
   * Called when the push procedure is complete and the actual rendering is finished
   */
  onPushed?: StackflowPluginPostEffectHook<"PUSHED">;

  /**
   * Called when the replace procedure is complete and the actual rendering is finished
   */
  onReplaced?: StackflowPluginPostEffectHook<"REPLACED">;

  /**
   * Called when the pop procedure is complete and the actual rendering is finished
   */
  onPopped?: StackflowPluginPostEffectHook<"POPPED">;

  /**
   * Called when the nestedPush procedure is complete and the actual rendering is finished
   */
  onNestedPushed?: StackflowPluginPostEffectHook<"NESTED_PUSHED">;

  /**
   * Called when the nestedReplace procedure is complete and the actual rendering is finished
   */
  onNestedReplaced?: StackflowPluginPostEffectHook<"NESTED_REPLACED">;

  /**
   * Called when the nestedPop procedure is complete and the actual rendering is finished
   */
  onNestedPopped?: StackflowPluginPostEffectHook<"NESTED_POPPED">;

  /**
   * Called after any changes to the stack state are reflected in the actual rendering
   */
  onChanged?: StackflowPluginPostEffectHook<"%SOMETHING_CHANGED%">;

  /**
   * Specifies the first `PushedEvent`, `NestedPushedEvent` (Overrides the `initialActivity` option specified in the `stackflow()` function)
   */
  overrideInitialEvents?: (args: {
    initialEvents: (PushedEvent | NestedPushedEvent)[];
  }) => (PushedEvent | NestedPushedEvent)[];
};
