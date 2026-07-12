/**
 * Consumer-fidelity runtime fixture, run in a plain Node process (no
 * bundler, no vitest): the built package must be requirable by its public
 * name and connect to a core store — in a process where React is not even
 * resolvable and no browser global exists. Prints a one-line JSON report.
 */
const report = {
  windowAbsent:
    typeof window === "undefined" && typeof document === "undefined",
};

try {
  require("react");
  report.reactResolvable = true;
} catch {
  report.reactResolvable = false;
}

try {
  require("@stackflow/plugin-history-sync");
  report.historySyncResolvable = true;
} catch {
  report.historySyncResolvable = false;
}

try {
  const pkg = require("@stackflow/plugin-stack-persistence");
  const core = require("@stackflow/core");

  report.publicExports = Object.keys(pkg).sort();
  report.loadErrorExtendsError =
    new pkg.StackPersistenceLoadError({
      kind: "storage",
      detail: null,
    }) instanceof Error;
  report.saveErrorExtendsError =
    new pkg.StackPersistenceSaveError({
      kind: "strategy",
      detail: null,
    }) instanceof Error;

  const past = 1_700_000_000_000;
  const store = core.makeCoreStore({
    initialEvents: [
      core.makeEvent("Initialized", {
        transitionDuration: 300,
        eventDate: past,
      }),
      core.makeEvent("ActivityRegistered", {
        activityName: "Home",
        eventDate: past + 1,
      }),
      core.makeEvent("Pushed", {
        activityId: "home-1",
        activityName: "Home",
        activityParams: {},
        eventDate: past + 10,
      }),
    ],
    plugins: [
      pkg.stackPersistencePlugin({
        storage: {
          load: () => null,
          save: () => Promise.resolve(),
        },
      }),
    ],
  });
  store.init();

  report.connected = true;
  report.activityNames = store.actions
    .getStack()
    .activities.map((activity) => activity.name);
} catch (error) {
  report.connected = false;
  report.error = String(error);
}

process.stdout.write(`${JSON.stringify(report)}\n`);
