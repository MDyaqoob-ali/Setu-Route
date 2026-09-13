from typing import Generator, Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db
from src.core.security import decode_token
from src.core.exceptions import InvalidCredentialsError, PermissionDeniedError
from src.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    payload = decode_token(token)
    if not payload or not payload.get("sub"):
        return None
    
    user_id = payload.get("sub")
    query = select(User).where(User.id == user_id, User.is_active == True)
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not token:
        raise InvalidCredentialsError()
    user = await get_current_user_optional(token, db)
    if not user:
        raise InvalidCredentialsError()
    return user

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if "SUPER_ADMIN" == current_user.role:
            return current_user
        if current_user.role not in allowed_roles:
            raise PermissionDeniedError(
                f"Role '{current_user.role}' is not authorized to perform this operation. Allowed: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker
