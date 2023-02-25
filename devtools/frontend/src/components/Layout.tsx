import * as css from "./Layout.css";
import Header from "./Header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={css.container}>
      <div className={css.headerContainer}>
        <Header />
      </div>
      <div className={css.tabContainer}>{children}</div>
    </div>
  );
}
