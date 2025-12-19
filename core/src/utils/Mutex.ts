export class Mutex {
  private latestlyBookedSession: Promise<void> = Promise.resolve();

  acquire(): Promise<{ release: () => void }> {
    return new Promise((resolveSessionHandle) => {
      this.latestlyBookedSession = this.latestlyBookedSession.then(
        () =>
          new Promise((resolveSession) =>
            resolveSessionHandle({ release: () => resolveSession() }),
          ),
      );
    });
  }

  async runExclusively<T>(thunk: () => Promise<T>): Promise<T> {
    const { release } = await this.acquire();

    try {
      return await thunk();
    } finally {
      release();
    }
  }
}
