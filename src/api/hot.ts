const registry = globalThis as typeof globalThis & { [key: symbol]: unknown };

export const hotSingleton = <T>(name: string, create: () => T): T => {
  const key = Symbol.for(`bhop.hot.${name}`);
  if (!(key in registry)) registry[key] = create();
  return registry[key] as T;
};
