/**
 * ICacheService defines a generic interface for interacting with a Redis cache.
 * Methods use JSON for data serialization/deserialization.
 */
export abstract class ICacheService {
  abstract set<T>(key: string, value: T, ttl?: number): Promise<void>;
  abstract get<T>(key: string): Promise<T | null>;
  abstract del(key: string): Promise<void>;
  abstract exists(key: string): Promise<boolean>;
  abstract lock(key: string, ttl: number): Promise<boolean>;
  abstract unlock(key: string): Promise<void>;
  abstract mget<T>(keys: string[]): Promise<(T | null)[]>;
  abstract delByPattern(pattern: string): Promise<void>;
  abstract expire(key: string, ttl: number): Promise<boolean>;
  abstract getTTL(key: string): Promise<number>;
}
