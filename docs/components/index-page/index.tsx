import Ellipse from "@assets/gradient-ellipse.webp";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSimpleReveal } from "simple-reveal";
import { Button } from "../Button";
import { Demo } from "../Demo";

export function IndexPage({ lang = "ko" }: { lang: "ko" | "en" }) {
  const { cn, ref, style } = useSimpleReveal({
    delay: 300,
    initialTransform: "translate3d(0, 1rem, 1rem);",
    duration: 1000,
  });

  return (
    <>
      <section className="relative w-full lg:min-h-[1000px] grid lg:grid-cols-2 place-items-center">
        <div className="flex flex-col items-center gap-2 my-8 lg:ml-8 lg:items-start lg:gap-0 lg:m-0">
          <h1 className="text-5xl lg:text-8xl font-extrabold">Stackflow</h1>

          <p className="text-sm lg:text-xl text-center">
            {lang === "ko"
              ? "JavaScript와 TypeScript를 위한 가장 간편한 스택 네비게이션 라이브러리."
              : "The Simplest Stack Navigation for JavaScript and TypeScript."}
          </p>
          <div className="flex items-center justify-center gap-1 lg:gap-2 w-full lg:w-auto lg:mt-4">
            <Button asChild variant="default" className="flex gap-2 pr-2">
              <Link href="/docs/introduction/what-is-stackflow">
                {lang === "ko" ? "시작하기" : "Get Started"}{" "}
                <ChevronRight className="size-6" />
              </Link>
            </Button>
          </div>
        </div>

        <div
          ref={ref}
          className={cn(
            "w-full max-w-[350px] h-[650px] lg:max-w-[450px] lg:h-[900px] relative flex",
          )}
          style={style}
        >
          <Demo />
          <div className="absolute inset-0 bg-gradient-to-t from-10% to-90% from-[rgb(255,255,255)] dark:from-[rgb(17,17,17)] to-[rgba(255,255,255,0)] z-50 pointer-events-none" />
        </div>
      </section>

      <Image
        src={Ellipse}
        alt="Gradient ellipse"
        width={1000}
        height={500}
        className="absolute w-full -z-10 top-20 left-0 right-0 opacity-40"
      />
    </>
  );
}
