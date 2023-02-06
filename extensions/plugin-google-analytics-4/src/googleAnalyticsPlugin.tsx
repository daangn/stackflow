import type { Stack } from "@stackflow/core";
import type { StackflowReactPlugin } from "@stackflow/react";
import ReactGA4 from "react-ga4";

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
      ReactGA4.initialize(trackingId, {
        gaOptions: {
          send_page_view: false,
        },
      });

      ReactGA4.set({
        user_id: userInfo?.userId,
        user_properties: userInfo?.userProperties,
      });
    },
    onPushed({ actions }) {
      type K = Extract<keyof T, string>;
      const activityName = getActiveActivityName(actions.getStack()) as
        | K
        | undefined;

      ReactGA4.send({
        hitType: "pageview",
        path: window.location.pathname,
        location: window.location.pathname,
        title: useTitle ? window.location.pathname : activityName,
        page_referrer: document.referrer,
      });
    },
    onPopped({ actions }) {
      type K = Extract<keyof T, string>;
      const activityName = getActiveActivityName(actions.getStack()) as
        | K
        | undefined;

      ReactGA4.send({
        hitType: "pageview",
        path: window.location.pathname,
        location: window.location.pathname,
        title: useTitle ? window.location.pathname : activityName,
        page_referrer: document.referrer,
      });
    },
    onReplaced({ actions }) {
      type K = Extract<keyof T, string>;
      const activityName = getActiveActivityName(actions.getStack()) as
        | K
        | undefined;

      ReactGA4.send({
        hitType: "pageview",
        path: window.location.pathname,
        location: window.location.pathname,
        title: useTitle ? window.location.pathname : activityName,
        page_referrer: document.referrer,
      });
    },
    wrapStack({ stack }) {
      return (
        <GoogleAnalyticsContext.Provider
          // eslint-disable-next-line react/jsx-no-constructed-context-values
          value={{
            sendEvent: ReactGA4.event,
            setConfig: ReactGA4.set,
          }}
        >
          {stack.render()}
        </GoogleAnalyticsContext.Provider>
      );
    },
  });
}
