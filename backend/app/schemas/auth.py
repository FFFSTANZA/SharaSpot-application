"""Authentication request/response schemas"""
from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    """Schema for user signup request"""
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    """Schema for user login request"""
    email: EmailStr
    password: str


class PreferencesUpdate(BaseModel):
    """Schema for updating user preferences"""
    port_type: str
    vehicle_type: str
    distance_unit: str
