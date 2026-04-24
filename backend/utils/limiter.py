import os
import logging

from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)

_REDIS_URL = os.getenv("REDIS_URL")  # e.g. redis://localhost:6379

if _REDIS_URL:
    # Distributed rate limiting: counters are shared across all workers and
    # instances. Without this, each uvicorn worker has its own in-memory counter,
    # so a "5/minute" limit becomes "5 × worker_count / minute" in practice.
    limiter = Limiter(key_func=get_remote_address, storage_uri=_REDIS_URL)
    logger.info("Rate limiter using Redis storage: %s", _REDIS_URL)
else:
    # Fallback to in-memory: safe for single-worker local dev, but rate limits
    # are per-process in multi-worker / multi-instance deployments.
    limiter = Limiter(key_func=get_remote_address)
    logger.warning(
        "Rate limiter using in-memory storage (REDIS_URL not set). "
        "Limits will NOT be shared across workers or instances. "
        "Set REDIS_URL in production."
    )
