"""
Input validators for SharaSpot API
Addresses P1 issue #10: Input validation for coordinates and other data
Addresses P0 issue #3: Password validation
"""

import re
from typing import Optional, Tuple
from fastapi import HTTPException
from config import (
    CoordinateRange,
    MIN_PASSWORD_LENGTH,
    MAX_PASSWORD_LENGTH,
    REQUIRE_UPPERCASE,
    REQUIRE_LOWERCASE,
    REQUIRE_DIGIT,
    REQUIRE_SPECIAL_CHAR,
    ErrorMessages
)


def validate_coordinates(latitude: float, longitude: float) -> Tuple[bool, Optional[str]]:
    """
    Validate latitude and longitude values

    Args:
        latitude: Latitude value to validate
        longitude: Longitude value to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not isinstance(latitude, (int, float)):
        return False, "Latitude must be a number"

    if not isinstance(longitude, (int, float)):
        return False, "Longitude must be a number"

    if not (CoordinateRange.MIN_LATITUDE <= latitude <= CoordinateRange.MAX_LATITUDE):
        return False, f"Latitude must be between {CoordinateRange.MIN_LATITUDE} and {CoordinateRange.MAX_LATITUDE}"

    if not (CoordinateRange.MIN_LONGITUDE <= longitude <= CoordinateRange.MAX_LONGITUDE):
        return False, f"Longitude must be between {CoordinateRange.MIN_LONGITUDE} and {CoordinateRange.MAX_LONGITUDE}"

    return True, None


def validate_password(password: str) -> Tuple[bool, Optional[str]]:
    """
    Validate password strength

    Password requirements:
    - Minimum 8 characters
    - Maximum 128 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character

    Args:
        password: Password to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not password or not isinstance(password, str):
        return False, "Password is required"

    if len(password) < MIN_PASSWORD_LENGTH:
        return False, f"Password must be at least {MIN_PASSWORD_LENGTH} characters long"

    if len(password) > MAX_PASSWORD_LENGTH:
        return False, f"Password must not exceed {MAX_PASSWORD_LENGTH} characters"

    if REQUIRE_UPPERCASE and not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"

    if REQUIRE_LOWERCASE and not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"

    if REQUIRE_DIGIT and not re.search(r'\d', password):
        return False, "Password must contain at least one digit"

    if REQUIRE_SPECIAL_CHAR and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)"

    # Check for common weak passwords
    weak_passwords = [
        'password', 'password123', '12345678', 'qwerty123', 'admin123',
        'letmein', 'welcome', 'monkey', '1234567890', 'password1'
    ]
    if password.lower() in weak_passwords:
        return False, "This password is too common. Please choose a stronger password"

    return True, None


def validate_email(email: str) -> Tuple[bool, Optional[str]]:
    """
    Validate email format

    Args:
        email: Email to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not email or not isinstance(email, str):
        return False, "Email is required"

    # Basic email regex pattern
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        return False, "Invalid email format"

    if len(email) > 255:
        return False, "Email is too long"

    return True, None


def validate_port_types(port_types: list) -> Tuple[bool, Optional[str]]:
    """
    Validate charger port types

    Args:
        port_types: List of port type strings

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not port_types or not isinstance(port_types, list):
        return False, "Port types must be a non-empty list"

    if len(port_types) == 0:
        return False, "At least one port type is required"

    valid_port_types = {
        "Type 1", "Type 2", "CCS", "CHAdeMO", "Tesla", "GB/T", "Type 3"
    }

    for port_type in port_types:
        if not isinstance(port_type, str):
            return False, "Port types must be strings"
        if port_type not in valid_port_types:
            return False, f"Invalid port type: {port_type}. Valid types: {', '.join(valid_port_types)}"

    return True, None


def validate_port_count(available_ports: int, total_ports: int) -> Tuple[bool, Optional[str]]:
    """
    Validate port counts

    Args:
        available_ports: Number of available ports
        total_ports: Total number of ports

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not isinstance(available_ports, int) or not isinstance(total_ports, int):
        return False, "Port counts must be integers"

    if total_ports < 1:
        return False, "Total ports must be at least 1"

    if available_ports < 0:
        return False, "Available ports cannot be negative"

    if available_ports > total_ports:
        return False, "Available ports cannot exceed total ports"

    if total_ports > 100:
        return False, "Total ports cannot exceed 100"

    return True, None


def validate_amenities(amenities: list) -> Tuple[bool, Optional[str]]:
    """
    Validate amenity list

    Args:
        amenities: List of amenity strings

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not isinstance(amenities, list):
        return False, "Amenities must be a list"

    valid_amenities = {
        "restroom", "cafe", "wifi", "parking", "shopping",
        "restaurant", "atm", "hotel", "rest_area"
    }

    for amenity in amenities:
        if not isinstance(amenity, str):
            return False, "Amenities must be strings"
        if amenity not in valid_amenities:
            return False, f"Invalid amenity: {amenity}. Valid amenities: {', '.join(valid_amenities)}"

    return True, None


def validate_charger_name(name: str) -> Tuple[bool, Optional[str]]:
    """
    Validate charger name

    Args:
        name: Charger name

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not name or not isinstance(name, str):
        return False, "Charger name is required"

    name = name.strip()
    if len(name) < 3:
        return False, "Charger name must be at least 3 characters long"

    if len(name) > 200:
        return False, "Charger name must not exceed 200 characters"

    return True, None


def validate_address(address: str) -> Tuple[bool, Optional[str]]:
    """
    Validate address

    Args:
        address: Address string

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not address or not isinstance(address, str):
        return False, "Address is required"

    address = address.strip()
    if len(address) < 5:
        return False, "Address must be at least 5 characters long"

    if len(address) > 500:
        return False, "Address must not exceed 500 characters"

    return True, None


def sanitize_string(value: str, max_length: int = 1000) -> str:
    """
    Sanitize string input to prevent injection attacks

    Args:
        value: String to sanitize
        max_length: Maximum allowed length

    Returns:
        Sanitized string
    """
    if not value or not isinstance(value, str):
        return ""

    # Remove null bytes
    value = value.replace('\x00', '')

    # Trim whitespace
    value = value.strip()

    # Limit length
    if len(value) > max_length:
        value = value[:max_length]

    return value


def validate_verification_action(action: str) -> Tuple[bool, Optional[str]]:
    """
    Validate verification action type

    Args:
        action: Verification action

    Returns:
        Tuple of (is_valid, error_message)
    """
    from config import VerificationAction as VA

    valid_actions = [VA.ACTIVE, VA.NOT_WORKING, VA.PARTIAL]
    if action not in valid_actions:
        return False, f"Invalid action. Must be one of: {', '.join(valid_actions)}"

    return True, None


def validate_battery_params(
    battery_capacity_kwh: float,
    current_battery_percent: float
) -> Tuple[bool, Optional[str]]:
    """
    Validate battery parameters for routing

    Args:
        battery_capacity_kwh: Battery capacity in kWh
        current_battery_percent: Current battery percentage

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not isinstance(battery_capacity_kwh, (int, float)):
        return False, "Battery capacity must be a number"

    if battery_capacity_kwh < 10 or battery_capacity_kwh > 200:
        return False, "Battery capacity must be between 10 and 200 kWh"

    if not isinstance(current_battery_percent, (int, float)):
        return False, "Battery percentage must be a number"

    if current_battery_percent < 0 or current_battery_percent > 100:
        return False, "Battery percentage must be between 0 and 100"

    return True, None
