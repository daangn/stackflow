module.exports = async () => {
  const server = globalThis.__HARNESS_PREVIEW__;
  if (server?.httpServer) {
    await new Promise((resolve) => server.httpServer.close(() => resolve()));
  }
};
