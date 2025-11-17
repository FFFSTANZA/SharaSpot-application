"""Authentication request/response schemas"""
from pydantic import BaseModel, EmailStr, Field, field_validator, constr
import html


class SignupRequest(BaseModel):
    """Schema for user signup request with input validation"""
    email: EmailStr
    password: constr(min_length=8, max_length=128) = Field(
        description="Password must be 8-128 characters"
    )
    name: constr(min_length=1, max_length=100, strip_whitespace=True) = Field(
        description="Name must be 1-100 characters"
    )

    @field_validator('name')
    @classmethod
    def sanitize_name(cls, v):
        """Sanitize name to prevent XSS attacks"""
        if v is not None:
            return html.escape(v)
        return v

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        """Validate password meets minimum security requirements"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class LoginRequest(BaseModel):
    """Schema for user login request"""
    email: EmailStr
    password: str  # No validation on login, only signup


class PreferencesUpdate(BaseModel):
    """Schema for updating user preferences with validation"""
    port_type: str = Field(pattern="^(Type 1|Type 2|CCS|CHAdeMO|Tesla|All)$")
    vehicle_type: str = Field(pattern="^(Sedan|SUV|Truck|Van|Motorcycle|Other)$")
    distance_unit: str = Field(pattern="^(km|mi)$", description="Must be 'km' or 'mi'")
