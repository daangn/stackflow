import { renderApp } from "@stackflow/demo-solid";
import { useEffect, useRef } from "react";

const SolidDemoRenderer: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return () => {};
    }
    renderApp(el, { theme: "cupertino" });
    return () => {
      el.innerHTML = "";
    };
  }, []);
  return <div ref={ref} />;
};

export default SolidDemoRenderer;
