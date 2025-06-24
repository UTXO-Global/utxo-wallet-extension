import { basicCache as cache } from "./index";

export function CacheResponse(ttl: number = 60000) {
  return function (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}_${JSON.stringify(args)}`;
      const cachedValue = cache.get(cacheKey);

      if (cachedValue) {
        return cachedValue;
      }

      const result = await originalMethod.apply(this, args);
      cache.set(cacheKey, result);

      // Optional: Clear the cache after TTL
      setTimeout(() => {
        cache.clear(cacheKey);
      }, ttl);

      return result;
    };

    return descriptor;
  };
}
