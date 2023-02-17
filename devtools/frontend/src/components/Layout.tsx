import * as css from "./Layout.css";
import Sidebar from "./Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={css.container}>
      <div className={css.sideBarContainer}>
        <Sidebar />
      </div>
      <div className={css.tabContainer}>{children}</div>
    </div>
  );
}
