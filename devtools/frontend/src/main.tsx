import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ActivitiesTab from "./tabs/ActivitiesTab";
import EventsTab from "./tabs/EventsTab";
import PluginsTab from "./tabs/PluginsTab";
import PlaygroundTab from "./tabs/PlaygroundTab";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <ActivitiesTab />,
      },
      {
        path: "events",
        element: <EventsTab />,
      },
      {
        path: "plugins",
        element: <PluginsTab />,
      },
      {
        path: "playground",
        element: <PlaygroundTab />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
