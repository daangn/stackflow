import Logo from "./Logo";
import * as css from "./Header.css";
import Github from "./icons/Github";
import Settings from "./icons/Settings";

export default function Header() {
  return (
    <div className={css.header}>
      <div className={css.leftContents}>
        <Logo />
      </div>
      <div className={css.rightContents}>
        <Github />
        {/* <Settings /> */}
      </div>
    </div>
  );
}
