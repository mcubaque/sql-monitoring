from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    if request.username == "admin" and request.password == "admin123":
        return LoginResponse(access_token="fake-jwt-token", token_type="bearer")
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
