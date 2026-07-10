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
import type { SnapshotLoadError } from "../SnapshotLoadError";
import type { SnapshotEvent, StackSnapshot } from "../StackSnapshot";
import type {
  StackflowPluginHook,
  StackflowPluginPostEffectHook,
  StackflowPluginPreEffectHook,
  StackInitInfo,
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
   * Intercept the event sequence a stack is built from. Chained across
   * plugins in array order — each plugin receives the previous one's
   * return. `initInfo` says which path is running, in the same record shape
   * `onInit` receives:
   * - `{ kind: "create" }`: `initialEvents` holds the initial entry events
   *   (`PushedEvent`/`StepPushedEvent`, from the `initialActivity` option or
   *   earlier plugins). The return decides the initial entries.
   * - `{ kind: "load" }`: `initialEvents` holds the provided snapshot's full
   *   replay sequence (structure-validated, original field values) —
   *   `Paused`/`Resumed` included when the snapshot recorded them. The
   *   return is adopted as the replay sequence — re-dated in array order so
   *   the restored stack settles, then run through the same load validation
   *   as the snapshot itself (activity registration, replay, at least one
   *   enter-state activity), so a failing return surfaces as a
   *   `SnapshotLoadError` to the snapshot provider. Reshaping the sequence
   *   reshapes the reconstructed navigation history — a plugin with no load
   *   policy must return `initialEvents` unchanged.
   */
  overrideInitialEvents?: (args: {
    initialEvents: SnapshotEvent[];
    initialContext: any;
    initInfo: StackInitInfo;
  }) => SnapshotEvent[];

  /**
   * Called synchronously at stack creation time to provide a snapshot to load
   * from. Returning `null` (or `undefined`) means "nothing to provide" and the
   * create path continues. If more than one plugin returns a non-null snapshot,
   * core throws a creation error naming the conflicting keys — it does not
   * arbitrate (R9).
   */
  provideSnapshot?: (args: {
    initialContext: any;
    // biome-ignore lint/suspicious/noConfusingVoidType: `void` is intentional — it lets a provider `return;` to signal "nothing to provide", as the JSDoc above promises. Narrowing to `undefined` would reject the common void-returning provider implementation.
  }) => StackSnapshot | null | void;

  /**
   * Called — only on the plugin that provided the failing snapshot (R5) — when
   * that snapshot fails to load. Returning `{ recover: "create" }` resumes the
   * create path without re-polling; returning nothing (or having no handler)
   * throws the `SnapshotLoadError` out of `makeCoreStore` (R4).
   */
  onLoadError?: (args: {
    error: SnapshotLoadError;
    initialContext: any;
    // biome-ignore lint/suspicious/noConfusingVoidType: `void` is intentional — it lets a handler return nothing to signal "throw the error". Narrowing to `undefined` would reject the common void-returning handler implementation.
  }) => { recover: "create" } | void;
};
