import { createContext, useContext } from "react";
import ReactGA4 from "react-ga4";

export const GoogleAnalyticsContext = createContext({
  sendEvent: ReactGA4.event,
  setConfig: ReactGA4.set,
});

export const useGoogleAnalyticsContext = () =>
  useContext(GoogleAnalyticsContext);
