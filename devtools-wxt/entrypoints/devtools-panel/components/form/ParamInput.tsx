import * as css from "./ParamInput.css";

export default function ParamInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return <input className={css.input} {...props}></input>;
}
