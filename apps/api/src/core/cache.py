"""
High-Performance In-Memory TTL Cache for NE-ROUTE API.
Provides sub-millisecond responses for read-heavy analytical and GIS queries.
"""

import time
from typing import Any, Optional, Dict, Tuple

class FastTTLCache:
    def __init__(self, default_ttl_sec: float = 3.0):
        self.default_ttl = default_ttl_sec
        self._cache: Dict[str, Tuple[float, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        entry = self._cache.get(key)
        if not entry:
            return None
        expires_at, value = entry
        if time.time() > expires_at:
            self._cache.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any, ttl_sec: Optional[float] = None) -> None:
        ttl = ttl_sec if ttl_sec is not None else self.default_ttl
        self._cache[key] = (time.time() + ttl, value)

    def invalidate(self, key_prefix: Optional[str] = None) -> None:
        if key_prefix is None:
            self._cache.clear()
        else:
            keys_to_delete = [k for k in self._cache if k.startswith(key_prefix)]
            for k in keys_to_delete:
                self._cache.pop(k, None)

fast_cache = FastTTLCache(default_ttl_sec=3.0)
