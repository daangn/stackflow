import { Stack } from "@stackflow/demo";
import { useSimpleReveal } from "simple-reveal";

const Demo: React.FC = ({ children }: React.PropsWithChildren) => {
  const { cn, ref, style } = useSimpleReveal({
    delay: 300,
    initialTransform: "translate3d(0, 1rem, 1rem);",
    duration: 1000,
  });

  return (
    <div
      ref={ref}
      className={cn()}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 390,
        display: "flex",
        justifyContent: "center",
        margin: "3rem 0",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 450,
            height: 900,
            position: "relative",
            borderRadius: "1rem",
            overflow: "hidden",
            transform: "translate3d(0, 0, 0)",
            maskImage: "-webkit-radial-gradient(white, black)",
          }}
        >
          {children}
          <Stack
            initialContext={{
              theme: "cupertino",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Demo;
