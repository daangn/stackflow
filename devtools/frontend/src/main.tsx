import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import {
  createBrowserRouter,
  RouteObject,
  RouterProvider,
} from "react-router-dom";
import ActivitiesTab from "./tabs/ActivitiesTab";
import EventsTab from "./tabs/EventsTab";
import PluginsTab from "./tabs/PluginsTab";
import ConsoleTab from "./tabs/ConsoleTab";

export const routes: (RouteObject & { name: string })[] = [
  {
    name: "Activities",
    index: true,
    path: "/",
    element: <ActivitiesTab />,
  },
  {
    name: "Events",
    path: "/events",
    element: <EventsTab />,
  },
  {
    name: "Plugins",
    path: "/plugins",
    element: <PluginsTab />,
  },
  {
    name: "Console",
    path: "/console",
    element: <ConsoleTab />,
  },
];

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: routes.map((route) => {
      return {
        index: !!route.index,
        path: route.path,
        element: route.element,
      };
    }),
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
