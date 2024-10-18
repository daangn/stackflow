export function CurrentDate({ locale }: { locale: "ko" | "en" }) {
  const today = new Date();
  return (
    <>
      {Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: undefined,
      }).format(today)}
    </>
  );
}
