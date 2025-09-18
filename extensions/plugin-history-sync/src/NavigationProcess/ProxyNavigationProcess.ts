import type { PushedEvent, Stack, StepPushedEvent } from "@stackflow/core";
import {
  type NavigationProcess,
  NavigationProcessStatus,
} from "./NavigationProcess";

export class ProxyNavigationProcess implements NavigationProcess {
  private impl: NavigationProcess | null = null;

  getStatus(): NavigationProcessStatus {
    return this.impl?.getStatus() ?? NavigationProcessStatus.IDLE;
  }

  captureNavigationOpportunity(
    stack: Stack | null,
    navigationTime: number,
  ): (PushedEvent | StepPushedEvent)[] {
    return this.impl?.captureNavigationOpportunity(stack, navigationTime) ?? [];
  }

  setImpl(impl: NavigationProcess) {
    if (this.impl) throw new Error("Impl already set");

    this.impl = impl;
  }
}
