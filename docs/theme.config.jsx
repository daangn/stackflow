import { useTheme } from "nextra-theme-docs";
import Favicon from "./assets/favicon.png";

const Logo = () => {
  const { theme, systemTheme } = useTheme();
  const dark = theme === "system" ? systemTheme === "dark" : theme === "dark";

  return (
    <svg
      width="173"
      height="27"
      viewBox="0 0 173 27"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.716573 20.4864C0.0215587 20.1593 0.0215589 19.629 0.716574 19.302L13.9301 13.0838C14.6252 12.7567 15.752 12.7567 16.447 13.0838L29.6606 19.302C30.3556 19.629 30.3556 20.1593 29.6606 20.4864L16.447 26.7045C15.752 27.0316 14.6252 27.0316 13.9301 26.7045L0.716573 20.4864Z"
        fill="#A03A03"
      />
      <path
        d="M0.716573 15.6357C0.0215587 15.3086 0.0215589 14.7783 0.716574 14.4512L13.9301 8.23309C14.6252 7.90603 15.752 7.90603 16.447 8.23309L29.6606 14.4512C30.3556 14.7783 30.3556 15.3086 29.6606 15.6357L16.447 21.8538C15.752 22.1809 14.6252 22.1809 13.9301 21.8538L0.716573 15.6357Z"
        fill="#CC4700"
      />
      <path
        d="M0.716573 7.69803C0.0215587 7.37097 0.0215589 6.84069 0.716574 6.51362L13.9301 0.29547C14.6252 -0.0315956 15.752 -0.0315955 16.447 0.29547L29.6606 6.51362C30.3556 6.84069 30.3556 7.37097 29.6606 7.69803L16.447 13.9162C15.752 14.2433 14.6252 14.2433 13.9301 13.9162L0.716573 7.69803Z"
        fill="#FF6F0F"
      />
      <path
        d="M51.9091 23.3633C47.6946 23.3633 44.9997 21.2941 43.8816 18.2494L47.838 15.8846C48.5547 17.599 49.7875 18.7519 52.0524 18.7519C54.2313 18.7519 54.776 17.8651 54.776 17.067C54.776 15.7959 53.6293 15.2934 50.619 14.4361C47.6373 13.5789 44.713 12.1009 44.713 8.13981C44.713 4.14919 47.9813 1.84351 51.4504 1.84351C54.7474 1.84351 57.3276 3.46931 58.7898 6.514L54.9194 8.84925C54.2313 7.37125 53.2852 6.45488 51.4504 6.45488C50.0169 6.45488 49.3001 7.19388 49.3001 8.02157C49.3001 8.96749 49.7875 9.61781 52.9125 10.5933C55.9515 11.5392 59.3632 12.6329 59.3632 17.0078C59.3632 20.9985 56.2669 23.3633 51.9091 23.3633Z"
        fill={dark ? "white" : "black"}
      />
      <path
        d="M69.4925 12.426H66.5395V17.6582C66.5395 18.9292 67.6003 19.0475 69.4925 18.9292V22.9494C63.8733 23.5406 62.2391 21.7966 62.2391 17.6582V12.426H59.9455V8.16937H62.2391V5.36116L66.5395 4.03095V8.16937H69.4925V12.426Z"
        fill={dark ? "white" : "black"}
      />
      <path
        d="M82.0545 8.16937H86.3549V22.9494H82.0545V21.5601C81.1084 22.6834 79.7036 23.3633 77.7827 23.3633C74.027 23.3633 70.9307 19.9638 70.9307 15.5594C70.9307 11.1549 74.027 7.75553 77.7827 7.75553C79.7036 7.75553 81.1084 8.43541 82.0545 9.55869V8.16937ZM78.6428 19.1657C80.621 19.1657 82.0545 17.7764 82.0545 15.5594C82.0545 13.3424 80.621 11.9531 78.6428 11.9531C76.6646 11.9531 75.2311 13.3424 75.2311 15.5594C75.2311 17.7764 76.6646 19.1657 78.6428 19.1657Z"
        fill={dark ? "white" : "black"}
      />
      <path
        d="M96.3907 23.3633C92.0329 23.3633 88.7932 19.9638 88.7932 15.5594C88.7932 11.1549 92.0329 7.75553 96.3907 7.75553C99.1716 7.75553 101.637 9.26309 102.87 11.5392L99.1143 13.7858C98.6269 12.7512 97.5948 12.1304 96.3333 12.1304C94.4698 12.1304 93.0936 13.5197 93.0936 15.5594C93.0936 17.599 94.4698 18.9884 96.3333 18.9884C97.5948 18.9884 98.6556 18.3676 99.1143 17.333L102.87 19.55C101.637 21.8557 99.2003 23.3633 96.3907 23.3633Z"
        fill={dark ? "white" : "black"}
      />
      <path
        d="M118.362 22.9494H113.488L108.901 16.4166V22.9494H104.601V2.25735H108.901V14.643L113.202 8.16937H118.219L113.001 15.5594L118.362 22.9494Z"
        fill={dark ? "white" : "black"}
      />
      <path
        d="M127.828 1.84351C129.863 1.84351 131.469 2.16867 133.131 2.55295V22.9494H128.831V5.71588C128.487 5.68632 128.143 5.68632 127.828 5.68632C126.222 5.68632 125.161 6.45488 125.161 8.16937H127.254V12.426H125.161V22.9494H120.861V12.426H118.94V8.16937H120.861C120.861 4.03095 123.068 1.84351 127.828 1.84351Z"
        fill={dark ? "white" : "black"}
      />
      <path
        d="M143.175 23.3633C138.96 23.3633 135.577 19.9638 135.577 15.5594C135.577 11.1549 138.96 7.75553 143.175 7.75553C147.389 7.75553 150.772 11.1549 150.772 15.5594C150.772 19.9638 147.389 23.3633 143.175 23.3633ZM143.175 19.0475C145.038 19.0475 146.472 17.6582 146.472 15.5594C146.472 13.4606 145.038 12.0713 143.175 12.0713C141.311 12.0713 139.878 13.4606 139.878 15.5594C139.878 17.6582 141.311 19.0475 143.175 19.0475Z"
        fill={dark ? "white" : "black"}
      />
      <path
        d="M168.413 8.16937H173L168.413 22.9494H164.399L162.106 15.0569L159.812 22.9494H155.798L151.211 8.16937H155.798L157.863 16.0915L160.099 8.16937H164.113L166.349 16.0915L168.413 8.16937Z"
        fill={dark ? "white" : "black"}
      />
    </svg>
  );
};

const SEED_SCALE_COLOR_SCRIPT = `(()=>{var e=document.documentElement,d=window.matchMedia("(prefers-color-scheme: dark)"),a=()=>{e.dataset.seed="",e.dataset.seedScaleColor=d.matches?"dark":"light"};"addEventListener"in d?d.addEventListener("change",a):"addListener"in d&&d.addListener(a),a()})();`;
const NEXTRA_THEME_SCRIPT = `(()=>{var e=document.documentElement,d=window.matchMedia("(prefers-color-scheme: dark)"),s=()=>{e.classList.remove("light"),e.classList.remove("dark"),d.matches?e.classList.add("dark"):e.classList.add("light")};"addEventListener"in d?d.addEventListener("change",s):"addListener"in d&&d.addListener(s),s()})();`;

export default {
  project: {
    link: "https://github.com/daangn/stackflow",
  },
  docsRepositoryBase: "https://github.com/daangn/stackflow/tree/main/docs",
  useNextSeoProps() {
    return {
      titleTemplate: "%s - Stackflow",
    };
  },
  sidebar: {
    defaultMenuCollapseLevel: 2,
  },
  navigation: {
    prev: true,
    next: true,
  },
  darkMode: false,
  footer: {
    text: <span>MIT {new Date().getFullYear()} © Stackflow</span>,
  },
  search: {
    placeholder: "검색어를 입력하세요...",
  },
  logo: <Logo />,
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta
        name="description"
        content="Mobile-first stack navigator framework with Composable Plugin System"
      />
      <meta name="og:title" content="Stackflow" />
      <link rel="shortcut icon" type="image/x-icon" href={Favicon.src} />
      <script dangerouslySetInnerHTML={{ __html: SEED_SCALE_COLOR_SCRIPT }} />
      <script dangerouslySetInnerHTML={{ __html: NEXTRA_THEME_SCRIPT }} />
    </>
  ),
};
