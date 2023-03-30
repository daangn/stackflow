import { useReducer } from "react";

export default function FloatingButton({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, toggle] = useReducer((open) => !open, false);

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
      }}
    >
      <div
        style={{
          width: "1.5rem",
          height: "1.5rem",
          opacity: 0.5,
          display: "inline-block",
          padding: "0.25rem",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={toggle}
      >
        {icon}
      </div>
      <div
        style={{
          position: "absolute",
          right: 0,
          border: "1px solid gray",
          borderRadius: "0.5rem",
          padding: "0.5rem",
          transition: "opacity 0.1s ease-in-out",
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
          backgroundColor: "#242424",
          zIndex: 2,
        }}
      >
        {children}
      </div>
    </div>
  );
}
