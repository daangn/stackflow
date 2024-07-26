import { defineActivity } from "defineActivity";
import { z } from "zod";
import type { ActivityBaseSchema } from "./ActivityBaseSchema";
import type { ActivityDefinition } from "./ActivityDefinition";
import type { Config } from "./Config";

export function defineConfig<
  ActivityNames extends string,
  Activity extends ActivityDefinition<ActivityNames, z.Schema<{}>>,
>(config: Config<Activity>) {
  return config;
}

defineConfig({
  activities: [
    defineActivity({
      name: "1",
      path: "/124",
      schema: z.object({}),
    }),
  ],
  transitionDuration: 350,
});

type A = z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;

const a: z.Schema<{}> = z.object({});

const b = defineActivity({
  name: "1",
  path: "/124",
  schema: z.object({}) satisfies z.Schema<{}>,
});

type B = typeof b;
type C = B extends ActivityDefinition<string, z.Schema<{}>> ? 1 : 0;
