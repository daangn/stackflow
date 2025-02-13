import type {
  PausedEvent,
  PoppedEvent,
  PushedEvent,
  ReplacedEvent,
  ResumedEvent,
  StepPoppedEvent,
  StepPushedEvent,
  StepReplacedEvent,
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
   * Called before the `stepPush()` function of `useStepActions()` is called and the corresponding signal is delivered to the core
   */
  onBeforeStepPush?: StackflowPluginPreEffectHook<
    Omit<StepPushedEvent, keyof BaseDomainEvent>
  >;

  /**
   * Called before the `stepReplace()` function of `useStepAction()` is called and the corresponding signal is delivered to the core
   */
  onBeforeStepReplace?: StackflowPluginPreEffectHook<
    Omit<StepReplacedEvent, keyof BaseDomainEvent>
  >;

  /**
   * Called before the `stepPop()` function of `useStepActions()` is called and the corresponding signal is delivered to the core
   */
  onBeforeStepPop?: StackflowPluginPreEffectHook<
    Omit<StepPoppedEvent, keyof BaseDomainEvent>
  >;

  /**
   * Called before `PausedEvent` dispatched
   */
  onBeforePause?: StackflowPluginPreEffectHook<
    Omit<PausedEvent, keyof BaseDomainEvent>
  >;

  /**
   * Called before `ResumedEvent` dispatched
   */
  onBeforeResume?: StackflowPluginPreEffectHook<
    Omit<ResumedEvent, keyof BaseDomainEvent>
  >;

  /**
   * Called when the `push` procedure is complete and the actual rendering is finished
   */
  onPushed?: StackflowPluginPostEffectHook<"PUSHED">;

  /**
   * Called when the `replace` procedure is complete and the actual rendering is finished
   */
  onReplaced?: StackflowPluginPostEffectHook<"REPLACED">;

  /**
   * Called when the `pop` procedure is complete and the actual rendering is finished
   */
  onPopped?: StackflowPluginPostEffectHook<"POPPED">;

  /**
   * Called when the `stepPush` procedure is complete and the actual rendering is finished
   */
  onStepPushed?: StackflowPluginPostEffectHook<"STEP_PUSHED">;

  /**
   * Called when the `stepReplace` procedure is complete and the actual rendering is finished
   */
  onStepReplaced?: StackflowPluginPostEffectHook<"STEP_REPLACED">;

  /**
   * Called when the `stepPop` procedure is complete and the actual rendering is finished
   */
  onStepPopped?: StackflowPluginPostEffectHook<"STEP_POPPED">;

  /**
   * Called when stack paused
   */
  onPaused?: StackflowPluginPostEffectHook<"PAUSED">;

  /**
   * Called when stack resumed
   */
  onResumed?: StackflowPluginPostEffectHook<"RESUMED">;

  /**
   * Called after any changes to the stack state are reflected in the actual rendering
   */
  onChanged?: StackflowPluginPostEffectHook<"%SOMETHING_CHANGED%">;

  /**
   * Specifies the first `PushedEvent`, `StepPushedEvent` (Overrides the `initialActivity` option specified in the `stackflow()` function)
   */
  overrideInitialEvents?: (args: {
    initialEvents: (PushedEvent | StepPushedEvent)[];
    initialContext: any;
  }) => (PushedEvent | StepPushedEvent)[];
};
