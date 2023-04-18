import type { Stack } from "@stackflow/core";
import type { StackflowReactPlugin } from "@stackflow/react";
import * as ReactGA4 from "react-ga4";

import { GoogleAnalyticsContext } from "./contexts";

function getActiveActivityName(stack: Stack) {
  return stack.activities.find((activity) => activity.isActive)?.name;
}

declare global {
  interface Window {
    gtag: any;
  }
}

export type GoogleAnalyticsPluginOptions = {
  trackingId: string;
  useTitle?: boolean;
  userInfo?: {
    userId: string;
    userProperties: Record<string, string>;
  };
};

export function googleAnalyticsPlugin<
  T extends { [activityName: string]: unknown },
>({
  trackingId,
  userInfo,
  useTitle = false,
}: GoogleAnalyticsPluginOptions): StackflowReactPlugin<T> {
  return () => ({
    key: "@daangn/stackflow-google-analytics-plugin",
    onInit() {
      ReactGA4.default.initialize(trackingId, {
        gaOptions: {
          send_page_view: false,
        },
      });

      ReactGA4.default.set({
        user_id: userInfo?.userId,
        user_properties: userInfo?.userProperties,
      });
    },
    onPushed({ actions }) {
      type K = Extract<keyof T, string>;
      const activityName = getActiveActivityName(actions.getStack()) as
        | K
        | undefined;

      ReactGA4.default.send({
        hitType: "pageview",
        path: window.location.pathname,
        location: window.location.pathname,
        title: useTitle ? document.title : activityName,
        page_referrer: document.referrer,
      });
    },
    onPopped({ actions }) {
      type K = Extract<keyof T, string>;
      const activityName = getActiveActivityName(actions.getStack()) as
        | K
        | undefined;

      ReactGA4.default.send({
        hitType: "pageview",
        path: window.location.pathname,
        location: window.location.pathname,
        title: useTitle ? document.title : activityName,
        page_referrer: document.referrer,
      });
    },
    onReplaced({ actions }) {
      type K = Extract<keyof T, string>;
      const activityName = getActiveActivityName(actions.getStack()) as
        | K
        | undefined;

      ReactGA4.default.send({
        hitType: "pageview",
        path: window.location.pathname,
        location: window.location.pathname,
        title: useTitle ? document.title : activityName,
        page_referrer: document.referrer,
      });
    },
    wrapStack({ stack }) {
      return (
        <GoogleAnalyticsContext.Provider
          // eslint-disable-next-line react/jsx-no-constructed-context-values
          value={{
            sendEvent: ReactGA4.default.event,
            setConfig: ReactGA4.default.set,
          }}
        >
          {stack.render()}
        </GoogleAnalyticsContext.Provider>
      );
    },
  });
}
