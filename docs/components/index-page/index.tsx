import { ChevronRight, ChevronsDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSimpleReveal } from "simple-reveal";
import Ellipse from "../../assets/gradient-ellipse.webp";
import { getLocaleBranch } from "../../utils/locale";
import { Demo } from "../Demo";
import { Github } from "./Github";
import { Tile } from "./Tile";

export function IndexPage({ lang = "ko" }: { lang: "ko" | "en" }) {
  const { cn, ref, style } = useSimpleReveal({
    delay: 300,
    initialTransform: "translate3d(0, 1rem, 1rem);",
    duration: 1000,
  });
  const getLocaleText = getLocaleBranch(lang);

  return (
    <main className="w-full lg:max-w-[1392px] mx-auto">
      <section className="relative w-full grid py-8 lg:py-24 lg:grid-cols-2 place-items-center">
        <div className="flex flex-col items-center gap-4 my-8 lg:ml-8 lg:items-start lg:gap-1 lg:m-0">
          <h1 className="text-5xl lg:text-8xl font-extrabold">Stackflow</h1>

          <p className="text-sm px-4 lg:px-0 lg:text-xl text-center">
            {getLocaleText(
              "JavaScript와 TypeScript를 위한 가장 간편한 스택 네비게이션 프레임워크.",
              "The Simplest Stack Navigation for JavaScript and TypeScript.",
            )}
          </p>
          <div className="flex items-center justify-center gap-2 lg:gap-2 w-full lg:w-auto lg:mt-4">
            <Link
              className="py-2 flex items-center gap-2 pl-4 pr-2 bg-primary text-primary-foreground hover:bg-primary/90 "
              href="/docs/get-started/introduction"
            >
              {getLocaleText("시작하기", "Get started")}{" "}
              <ChevronRight className="size-5" />
            </Link>
            <Link
              className="py-2 flex items-center gap-2 px-4 bg-neutral-950 text-primary-foreground hover:bg-neutral-950/80"
              href="https://github.com/daangn/stackflow"
            >
              View on Github <Github />
            </Link>
          </div>
        </div>

        <div
          ref={ref}
          className={cn(
            "w-full max-w-[350px] h-[650px] lg:max-w-[450px] lg:h-[800px] relative flex",
          )}
          style={style}
        >
          <Demo />
          <div className="absolute inset-0 bg-gradient-to-t from-10% to-90% from-[rgb(255,255,255)] dark:from-[rgb(17,17,17)] to-[rgba(255,255,255,0)] z-50 pointer-events-none" />
        </div>

        <Image
          src={Ellipse}
          alt="Gradient ellipse"
          width={1000}
          height={500}
          className="absolute w-full -z-10 top-20 left-0 opacity-40"
        />
        <ChevronsDown className="absolute lg:mx-auto bottom-10 size-8 animate-bounce opacity-75" />
      </section>

      <section className="w-full flex flex-col items-center px-6 pb-8 gap-16">
        <div className="flex text-xl lg:text-4xl gap-1">
          "
          <h1 className="text-xl text-center lg:text-3xl font-bold">
            Mobile-first Stack Navigator Framework with Composable Plugin System
          </h1>
          "
        </div>
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <Tile
            title="Headless Architecture"
            content={getLocaleText(
              "사전 구성된 UI 없이도 스택과 전이 상태를 사용하여 완전한 커스터마이징이 가능합니다.",
              "Use stack and transition states without pre-built UI, allowing full customization.",
            )}
          />
          <Tile
            title="Mobile-first Architecture"
            content={getLocaleText(
              "모바일 환경을 위해 최적화된 설계.",
              "Optimized for mobile environments.",
            )}
          />
          <Tile
            title="Composablity"
            content={getLocaleText(
              "플러그인 인터페이스를 통해 어느 라이프사이클에서든지 커스텀 기능을 주입하세요.",
              "Inject custom functionality via plugin interfaces at any lifecycle stage.",
            )}
          />
          <Tile
            title="Framework Agnostic"
            content={getLocaleText(
              "분리된 코어 로직 덕분에 다양한 프론트엔드 프레임워크와 매끄럽게 통합됩니다.",
              "Seamlessly integrate with diverse frontend frameworks due to its decoupled core logic.",
            )}
          />
          <Tile
            title="Cross-Platform Rendering"
            content={getLocaleText(
              "단일 코드베이스로 모바일 웹 뷰와 데스크톱 앱을 빌드하기 위한 커스텀 렌더 로직 주입이 가능합니다.",
              "Inject custom render logic to build both mobile web views and desktop apps from a single codebase.",
            )}
          />
          <Tile
            title="Server-side Rendering & TypeScript Support"
            content={getLocaleText(
              "서버사이드 렌더링과 타입스크립트를 완벽하게 지원합니다.",
              "Fully supports server-side rendering and TypeScript.",
            )}
          />
        </div>
      </section>

      <section className="w-full flex flex-col items-center px-6 py-40 gap-16">
        <h1 className="text-2xl lg:text-4xl font-bold text-center">
          Driven by the Community
        </h1>
        <Link href="https://github.com/daangn/stackflow/graphs/contributors">
          <Image
            src="https://contrib.rocks/image?repo=daangn/stackflow"
            alt=""
            width={800}
            height={800}
          />
        </Link>
      </section>
    </main>
  );
}
