import { useEffect, useRef, useState } from "react";

const duration = 200;

export default function Collapse({
  opened,
  children,
}: {
  opened: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [followed, setFollowed] = useState(false);

  useEffect(() => {
    if (opened) {
      const delay = setTimeout(() => {
        setFollowed(true);
      }, duration);
      return () => clearTimeout(delay);
    } else {
      setFollowed(false);
      const delay = setTimeout(() => {}, duration);
      return () => clearTimeout(delay);
    }
  }, [opened]);

  // heights
  // opened: (false -> true) = (0 -> clientHeight(instantly) -> auto(after 0.3s by timeout))
  // opened: (true -> false) = (auto -> clientHeight(instantly) -> 0(instantly))

  const height =
    followed && opened
      ? "auto"
      : followed || opened
      ? `${ref.current?.scrollHeight ?? 0}px`
      : "0";

  return (
    <div
      style={{
        height,
        overflow: "hidden",
        transition: `height .2s ease, opacity ${opened ? ".4s" : ".17s"} ease`,
        opacity: opened ? 1 : 0,
      }}
      ref={ref}
    >
      {children}
    </div>
  );
}
