"""
Middleware for SharaSpot API
Provides request logging, error handling, and security headers
"""

import time
import logging
from typing import Callable
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .constants import ErrorMessages

logger = logging.getLogger(__name__)


# ===========================
# Rate Limiter Setup
# ===========================
limiter = Limiter(key_func=get_remote_address)


# ===========================
# Request Logging Middleware
# ===========================
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all API requests with timing and status information
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Start timer
        start_time = time.time()

        # Get request details
        method = request.method
        path = request.url.path
        client_ip = get_remote_address(request)

        # Log request
        logger.info(f"Request started: {method} {path} from {client_ip}")

        try:
            # Process request
            response = await call_next(request)

            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000

            # Log response
            logger.info(
                f"Request completed: {method} {path} "
                f"Status: {response.status_code} "
                f"Duration: {duration_ms:.2f}ms "
                f"IP: {client_ip}"
            )

            # Add custom headers
            response.headers["X-Process-Time"] = f"{duration_ms:.2f}ms"
            response.headers["X-API-Version"] = "v1"

            return response

        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000

            # Log error (without sensitive details)
            logger.error(
                f"Request failed: {method} {path} "
                f"Error: {type(e).__name__} "
                f"Duration: {duration_ms:.2f}ms "
                f"IP: {client_ip}"
            )

            # Re-raise to let exception handlers deal with it
            raise


# ===========================
# Error Sanitization Middleware
# ===========================
class ErrorSanitizationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to sanitize error messages and prevent information leakage
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response

        except Exception as e:
            # Log the full error internally (for debugging)
            logger.exception(f"Internal error on {request.method} {request.url.path}")

            # Return generic error to client (no stack traces or internal details)
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "detail": ErrorMessages.INTERNAL_ERROR,
                    "error_id": id(e)  # Reference ID for support team
                }
            )


# ===========================
# Security Headers Middleware
# ===========================
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all responses
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        return response


# ===========================
# Rate Limit Handler
# ===========================
def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """
    Custom handler for rate limit exceeded errors
    """
    logger.warning(
        f"Rate limit exceeded: {request.method} {request.url.path} "
        f"from {get_remote_address(request)}"
    )

    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "detail": ErrorMessages.RATE_LIMIT_EXCEEDED,
            "retry_after": exc.detail.split(" ")[-1] if exc.detail else "60 seconds"
        }
    )
