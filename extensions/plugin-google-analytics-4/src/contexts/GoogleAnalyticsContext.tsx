import { createContext, useContext } from "react";
import * as ReactGA4 from "react-ga4";

export const GoogleAnalyticsContext = createContext({
  sendEvent: ReactGA4.default.event,
  setConfig: ReactGA4.default.set,
});

export const useGoogleAnalyticsContext = () =>
  useContext(GoogleAnalyticsContext);
