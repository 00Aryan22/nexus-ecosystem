from uuid import UUID

from fastapi import HTTPException, status

from app.models.auth import User


def ensure_owner(resource_user_id: UUID, current_user: User) -> None:
    if resource_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this resource",
        )
