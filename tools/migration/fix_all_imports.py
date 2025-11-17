#!/usr/bin/env python3
"""
Comprehensive Import Fixer

This script fixes ALL imports across the entire codebase to ensure
everything uses the correct modular structure paths.
"""

import re
from pathlib import Path
from typing import Dict, List, Tuple

BACKEND_PATH = Path(__file__).parent / "backend"
MODULES_PATH = BACKEND_PATH / "modules"

# Define correct import patterns for each module
MODULE_IMPORT_FIXES = {
    "auth": {
        # Wrong -> Correct
        r'from \.\.services import (auth_service|oauth_service)': r'from modules.auth.application import \1',
        r'from modules\.user\.domain\.user import': 'from modules.auth.domain.user import',
        r'from \.\.models\.user import': 'from modules.auth.domain.user import',
        r'from app\.models\.user import': 'from modules.auth.domain.user import',
        r'from \.\.schemas\.auth import': 'from modules.auth.presentation.auth import',
        r'from app\.schemas\.auth import': 'from modules.auth.presentation.auth import',
    },
    "chargers": {
        r'from \.\.services import (charger_service|s3_service)': r'from modules.chargers.application import \1',
        r'from \.\.models\.charger import': 'from modules.chargers.domain.charger import',
        r'from app\.models\.charger import': 'from modules.chargers.domain.charger import',
        r'from \.\.schemas\.charger import': 'from modules.chargers.presentation.charger import',
        r'from app\.schemas\.charger import': 'from modules.chargers.presentation.charger import',
    },
    "routing": {
        r'from \.\.services import (routing_service|weather_service)': r'from modules.routing.application import \1',
        r'from \.\.models\.routing import': 'from modules.routing.domain.routing import',
        r'from app\.models\.routing import': 'from modules.routing.domain.routing import',
        r'from \.\.schemas\.routing import': 'from modules.routing.presentation.routing import',
        r'from app\.schemas\.routing import': 'from modules.routing.presentation.routing import',
    },
    "gamification": {
        r'from \.\.services import gamification_service': 'from modules.gamification.application import gamification_service',
        r'from \.\.models\.coin import': 'from modules.gamification.domain.coin import',
        r'from app\.models\.coin import': 'from modules.gamification.domain.coin import',
    },
    "profile": {
        r'from \.\.services import profile_service': 'from modules.profile.application import profile_service',
        r'from \.\.schemas\.profile import': 'from modules.profile.presentation.profile import',
        r'from app\.schemas\.profile import': 'from modules.profile.presentation.profile import',
    },
    "analytics": {
        r'from \.\.services import analytics_service': 'from modules.analytics.application import analytics_service',
    },
}

# Common fixes for all modules
COMMON_FIXES = [
    # Fix relative imports to app.core
    (r'from \.\.core\.', 'from app.core.'),
    (r'from \.\.\.core\.', 'from app.core.'),

    # Fix database session imports
    (r'from \.\.core\.database import get_session', 'from app.core.database import get_session'),
    (r'from app\.core\.database import get_database', 'from app.core.database import get_session'),

    # Fix db_models imports
    (r'from \.\.core\.db_models import', 'from app.core.db_models import'),

    # Fix security imports
    (r'from \.\.core\.security import', 'from app.core.security import'),

    # Fix config imports
    (r'from \.\.core\.config import', 'from app.core.config import'),

    # Fix constants imports
    (r'from \.\.core\.constants import', 'from app.core.constants import'),

    # Fix middleware imports
    (r'from \.\.core\.middleware import', 'from app.core.middleware import'),
]


def fix_file_imports(file_path: Path, module_name: str) -> bool:
    """Fix imports in a single file"""
    if not file_path.exists():
        return False

    content = file_path.read_text(encoding='utf-8')
    original_content = content

    # Apply module-specific fixes
    if module_name in MODULE_IMPORT_FIXES:
        for pattern, replacement in MODULE_IMPORT_FIXES[module_name].items():
            content = re.sub(pattern, replacement, content)

    # Apply common fixes
    for pattern, replacement in COMMON_FIXES:
        content = re.sub(pattern, replacement, content)

    # Save if changed
    if content != original_content:
        file_path.write_text(content, encoding='utf-8')
        return True

    return False


def fix_auth_routes_specific():
    """Fix specific issues in auth routes"""
    routes_file = MODULES_PATH / "auth" / "presentation" / "routes.py"
    if not routes_file.exists():
        return

    content = routes_file.read_text()

    # Specific fixes for auth routes
    fixes = [
        ('from ..services import auth_service, oauth_service',
         'from modules.auth.application import auth_service, oauth_service'),
        ('from modules.user.domain.user import User',
         'from modules.auth.domain.user import User'),
    ]

    for old, new in fixes:
        content = content.replace(old, new)

    routes_file.write_text(content)
    print(f"  ✅ Fixed specific imports in auth/presentation/routes.py")


def fix_chargers_routes_specific():
    """Fix specific issues in chargers routes"""
    routes_file = MODULES_PATH / "chargers" / "presentation" / "routes.py"
    if not routes_file.exists():
        return

    content = routes_file.read_text()

    # Fix charger service imports
    content = re.sub(
        r'from \.\.services import charger_service',
        'from modules.chargers.application import charger_service',
        content
    )
    content = re.sub(
        r'from \.\.services\.s3_service import',
        'from modules.chargers.application.s3_service import',
        content
    )

    routes_file.write_text(content)
    print(f"  ✅ Fixed specific imports in chargers/presentation/routes.py")


def fix_all_module_imports():
    """Fix imports in all modules"""
    print("🔧 Fixing all module imports...\n")

    fixed_count = 0

    for module_dir in MODULES_PATH.iterdir():
        if not module_dir.is_dir():
            continue

        module_name = module_dir.name
        print(f"📦 Fixing {module_name} module...")

        # Fix all Python files in the module
        for py_file in module_dir.rglob("*.py"):
            if py_file.name == "__init__.py":
                continue

            if fix_file_imports(py_file, module_name):
                fixed_count += 1
                relative_path = py_file.relative_to(BACKEND_PATH)
                print(f"  ✅ Fixed {relative_path}")

    # Apply specific fixes
    print("\n🎯 Applying specific fixes...")
    fix_auth_routes_specific()
    fix_chargers_routes_specific()

    print(f"\n✅ Fixed imports in {fixed_count} files")


def verify_critical_files():
    """Verify critical files have correct imports"""
    print("\n🔍 Verifying critical files...\n")

    critical_files = [
        ("backend/main.py", [
            "from modules.auth.presentation.router import router",
            "from modules.chargers.presentation.router import router",
            "from modules.routing.presentation.router import router",
        ]),
        ("backend/modules/auth/presentation/routes.py", [
            "from modules.auth.application import auth_service",
            "from modules.auth.domain.user import User",
            "from modules.auth.presentation.auth import",
        ]),
        ("backend/modules/chargers/presentation/routes.py", [
            "from modules.chargers.application import charger_service",
        ]),
    ]

    all_good = True
    for file_path, expected_imports in critical_files:
        full_path = Path(__file__).parent / file_path
        if not full_path.exists():
            print(f"  ⚠️  {file_path} not found")
            all_good = False
            continue

        content = full_path.read_text()
        file_ok = True

        for expected_import in expected_imports:
            if expected_import not in content:
                print(f"  ❌ {file_path} missing: {expected_import}")
                file_ok = False
                all_good = False

        if file_ok:
            print(f"  ✅ {file_path}")

    return all_good


def create_proper_router_files():
    """Ensure all module routers properly export the router"""
    print("\n📋 Creating proper router files...\n")

    modules = ["auth", "chargers", "routing", "profile", "analytics"]

    for module in modules:
        router_file = MODULES_PATH / module / "presentation" / "router.py"

        # Read existing router
        if router_file.exists():
            content = router_file.read_text()

            # Ensure it properly imports and exports
            if "from .routes import router" not in content:
                # Update to properly import
                new_content = f'''"""
{module.title()} Module Router

Aggregates all {module} endpoints.
"""

from fastapi import APIRouter

# Import from routes
try:
    from .routes import router as {module}_router
except ImportError:
    {module}_router = APIRouter(prefix="/api/{module}", tags=["{module.title()}"])

# Export router
router = {module}_router
'''
                router_file.write_text(new_content)
                print(f"  ✅ Updated {module}/presentation/router.py")


def main():
    """Main function"""
    print("=" * 60)
    print("Comprehensive Import Fixer")
    print("=" * 60)

    # Fix all imports
    fix_all_module_imports()

    # Create proper router files
    create_proper_router_files()

    # Verify critical files
    print("\n" + "=" * 60)
    if verify_critical_files():
        print("\n✅ All critical files verified!")
    else:
        print("\n⚠️  Some files need manual review")

    print("=" * 60)
    print("\n✨ Import fixing complete!")
    print("\nNext: Test the backend with:")
    print("  cd backend && uvicorn main:app --reload")
    print("=" * 60)


if __name__ == "__main__":
    main()
