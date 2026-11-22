export type Limiter = <T>(task: () => Promise<T>) => Promise<T>;

export const limiter = (concurrency: number): Limiter => {
  let active = 0;
  const queue: (() => void)[] = [];

  const release = (): void => {
    active -= 1;
    queue.shift()?.();
  };

  return async (task) => {
    if (active >= concurrency) await new Promise<void>((resolve) => queue.push(resolve));
    active += 1;
    try {
      return await task();
    } finally {
      release();
    }
  };
};
