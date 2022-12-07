import React from "react";
import ReactGA4 from "react-ga4";

export const GoogleAnalyticsContext = React.createContext({
  sendEvent: ReactGA4.event,
});

export const useGoogleAnalyticsContext = () =>
  React.useContext(GoogleAnalyticsContext);
