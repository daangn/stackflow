import Logo from "./Logo";
import * as css from "./Sidebar.css";
import { Link, useLocation } from "react-router-dom";
import { routes } from "../main";

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className={css.sidebar}>
      <div className={css.topContent}>
        <Logo />
        <div className={css.tabs}>
          {routes.map((route) => {
            return (
              <Link to={route.path ?? "/"} key={route.name}>
                <button
                  className={
                    location.pathname === route.path
                      ? css.buttonActive
                      : css.button
                  }
                  key={route.name}
                >
                  {route.name}
                </button>
              </Link>
            );
          })}
        </div>
      </div>
      <div className={css.footer}>Stackflow v0.21.3</div>
    </div>
  );
}
