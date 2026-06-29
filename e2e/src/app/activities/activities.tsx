/**
 * The harness activities. All are plain screens; their navigation/step
 * behavior comes entirely from history-sync + the controls. Lazy's loading
 * window is produced by an async loader wired in the config, not by the
 * component itself.
 */

import type { ActivityComponentType } from "@stackflow/react";
import { Screen } from "../components/Screen";

declare module "@stackflow/config" {
  interface Register {
    Home: Record<string, never>;
    Article: { articleId: string; title?: string };
    Third: { thirdId: string };
    Fourth: { fourthId: string };
    Lazy: Record<string, never>;
  }
}

export const Home: ActivityComponentType<"Home"> = () => (
  <Screen activityName="Home" />
);

export const Article: ActivityComponentType<"Article"> = () => (
  <Screen activityName="Article" />
);

export const Third: ActivityComponentType<"Third"> = () => (
  <Screen activityName="Third" />
);

export const Fourth: ActivityComponentType<"Fourth"> = () => (
  <Screen activityName="Fourth" />
);

export const Lazy: ActivityComponentType<"Lazy"> = () => (
  <Screen activityName="Lazy" />
);
