export type Lang = "ko" | "en";

export const getLocaleBranch = (lang: Lang) => (ko: string, en: string) =>
  lang === "ko" ? ko : en;
