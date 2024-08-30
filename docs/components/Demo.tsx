import type { StackComponentType } from "@stackflow/react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useSimpleReveal } from "simple-reveal";

// @ts-ignore
const SolidDemoRenderer = dynamic(() => import("#solid-demo-renderer"), {
  ssr: false,
});

const Demo: React.FC<{ variants: ("react" | "solid")[] }> = ({
  variants = ["react"],
}) => {
  const [Stack, setStack] = useState<StackComponentType | null>(null);
  const { cn, ref, style } = useSimpleReveal({
    delay: 200,
    initialTransform: "scale(0.95)",
  });

  useEffect(() => {
    if (variants.includes("react") && !Stack) {
      import("@stackflow/demo").then(({ Stack }) => {
        setStack(Stack);
      });
    }
  }, [variants]);
  return (
    <div
      ref={ref}
      className={cn()}
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-evenly",
        margin: "2rem 0",
        ...style,
      }}
    >
      {variants.map((variant) => (
        <div
          key={variant}
          style={{
            width: "100%",
            maxWidth: "360px",
            margin: "1rem 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
            color: "#777",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "640px",
              position: "relative",
              borderRadius: ".5rem",
              overflow: "hidden",
              transform: "translate3d(0, 0, 0)",
              maskImage: "-webkit-radial-gradient(white, black)",
              boxShadow: "0 .25rem 1rem 0 rgba(0, 0, 0, .1)",
            }}
          >
            {variant === "react" ? (
              Stack && (
                <Stack
                  initialContext={{
                    theme: "cupertino",
                  }}
                />
              )
            ) : (
              <SolidDemoRenderer />
            )}
          </div>
          {
            {
              react: "React",
              solid: "Solid",
            }[variant]
          }
        </div>
      ))}
    </div>
  );
};

export default Demo;
