import { Stack } from "@stackflow/demo";

export function Demo() {
  return (
    <div className="relative w-full h-full flex justify-center">
      <div className="w-full h-full relative rounded-lg overflow-hidden">
        <div className="w-full h-full relative rounded-lg overflow-hidden transform translate3d(0, 0, 0) mask-image(-webkit-radial-gradient(white, black))">
          <Stack
            initialContext={{
              theme: "cupertino",
            }}
          />
        </div>
      </div>
    </div>
  );
}
