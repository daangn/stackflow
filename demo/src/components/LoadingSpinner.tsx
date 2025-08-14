import type { FC } from "react";

import * as css from "./LoadingSpinner.css";

const LoadingSpinner: FC = () => {
  return <div className={css.spinner} />;
};

export default LoadingSpinner;