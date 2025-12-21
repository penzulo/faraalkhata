from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.core.config import settings

ph = PasswordHasher()


def create_access_token(subject: str | Any, expires_delta: timedelta) -> str:
    """
    Create JSON Web Token and encode user data.
    """
    expire = datetime.now(UTC) + expires_delta
    to_encode: dict[str, str | datetime] = {"exp": expire, "sub": str(subject)}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)  # type: ignore unknownVariableType


def decode_access_token(token: str) -> str | None:
    """
    Decode JSON Web Token and return subject (user id/username)
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload.get("sub")
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def verify_password(plain: str, hashed: str) -> bool:
    """
    Checks the password against the hash.
    Returns True if valid, else False.
    """
    try:
        return ph.verify(hashed, plain)
    except VerifyMismatchError:
        return False


def get_password_hash(password: str) -> str:
    """
    Hashed the password using Argon2id.
    Output string format: $argon2id$v=19$m=65536,t=3,p=4$salt$hash
    """
    return ph.hash(password)
