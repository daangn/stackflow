import { useContext } from "react";
import { useActivity } from "../../stable";
import { ActivityLoaderContext } from "./ActivityLoaderContext";
import { useConfig } from "../useConfig";
import { getLoaderFn } from "@stackflow/config";

export function useLoader<T extends (...args: any[]) => any>(options: {
  loaderFn: T;
}): {
  data: ReturnType<T>;
  invalidate: () => void;
} {
  const activity = useActivity();
  const config = useConfig();
  const context = useContext(ActivityLoaderContext);

  if (!context) {
    throw new Error(
      "useLoader() must be used within an ActivityLoaderProvider. " +
        "Make sure you are using the loaderPlugin.",
    );
  }

  // Runtime validation: check if the provided loader matches the config
  const activityConfig = config.activities.find(
    (a) => a.name === activity.name,
  );
  const configLoaderFn = getLoaderFn(activityConfig?.loader);

  if (options.loaderFn !== configLoaderFn) {
    throw new Error(
      `Loader mismatch: the provided loader does not match the loader ` +
        `registered for "${activity.name}" activity in the config.`,
    );
  }

  return {
    data: context.loaderData as ReturnType<T>,
    invalidate: context.invalidate,
  };
}
