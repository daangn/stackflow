import * as css from "./Logo.css";

export default function Logo() {
  return (
    <div className={css.logo}>
      <div className={css.logoText}>Stackflow</div>
    </div>
  );
}
