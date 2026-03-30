export const baseUrl =
  process.env.NODE_ENV === "development"
    ? new URL("http://localhost:6006")
    : new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://stackflow.so");
