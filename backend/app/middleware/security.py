import time
import os
import redis
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
RATE_LIMIT_DURATION = 60 # seconds
RATE_LIMIT_REQUESTS = 100 # requests per minute

# Initialize Redis client pool
try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
except Exception as e:
    print(f"Warning: Redis not connected. Rate limits may fail. {e}")
    redis_client = None

class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Redis Rate Limiting
        client_ip = request.client.host if request.client else "127.0.0.1"
        current_time = int(time.time())
        
        if redis_client:
            key = f"rate_limit:{client_ip}"
            
            # Using a Redis Pipeline for atomic ops
            pipeline = redis_client.pipeline()
            pipeline.zremrangebyscore(key, 0, current_time - RATE_LIMIT_DURATION)
            pipeline.zadd(key, {str(current_time): current_time})
            pipeline.zcard(key)
            pipeline.expire(key, RATE_LIMIT_DURATION)
            
            try:
                results = pipeline.execute()
                request_count = results[2]
                
                if request_count > RATE_LIMIT_REQUESTS:
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Too Many Requests. Rate limit exceeded."}
                    )
            except Exception as e:
                # Fail open if Redis drops connection
                pass
        
        # 2. Process Request
        response: Response = await call_next(request)
        
        # 3. Security Headers (DDoS/XSS mitigations at application layer)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; object-src 'none';"
        
        return response
