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
import DispatcherTab from "./tabs/Dispatcher";

export const routes: (RouteObject & { name: string })[] = [
  {
    name: "Activities",
    index: true,
    path: "/",
    element: <ActivitiesTab />,
  },
  {
    name: "Dispatcher",
    path: "/dispatcher",
    element: <DispatcherTab />,
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
