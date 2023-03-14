import { Stack } from "@stackflow/demo";
import { useSimpleReveal } from "simple-reveal";

const Demo: React.FC = () => {
  const { cn, ref, style } = useSimpleReveal({
    delay: 200,
    initialTransform: "scale(0.95)",
  });
  return (
    <div
      ref={ref}
      className={cn()}
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        margin: "3rem 0",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          height: "640px",
          position: "relative",
          borderRadius: ".5rem",
          overflow: "hidden",
          transform: "translate3d(0, 0, 0)",
          maskImage: "-webkit-radial-gradient(white, black)",
          boxShadow: "0 .25rem 1rem 0 rgba(0, 0, 0, .1)",
        }}
      >
        <Stack
          initialContext={{
            theme: "cupertino",
          }}
        />
      </div>
    </div>
  );
};

export default Demo;
