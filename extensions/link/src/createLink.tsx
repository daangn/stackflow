import type { ActivityComponentType } from "@stackflow/react";
import React from "react";

import type { LinkProps, TypeLink } from "./Link";
import { Link } from "./Link";

export function createLink<T extends { [activityName: string]: unknown }>(): {
  Link: TypeLink<T>;
} {
  return {
    Link,
  };
}

const { Link: AA } = createLink<{
  hello: ActivityComponentType<{ hello: "world" }>;
  world: ActivityComponentType<{ world: "hello" }>;
}>();
