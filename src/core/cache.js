import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

export function getCache(key) {
  return cache.get(key);
}

export function setCache(key, value, ttl) {
  cache.set(key, value, ttl);
}

export function delCache(key) {
  cache.del(key);
}

export function flushCache() {
  cache.flushAll();
}

export default cache;
