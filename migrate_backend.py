#!/usr/bin/env python3
"""
Automated Backend Migration Script

This script migrates the existing backend code structure to the new modular monolith architecture.
It preserves all functionality while reorganizing code into proper modules.
"""

import os
import shutil
from pathlib import Path
from typing import Dict, List

# Define the migration mapping
BACKEND_PATH = Path(__file__).parent / "backend"
APP_PATH = BACKEND_PATH / "app"
MODULES_PATH = BACKEND_PATH / "modules"

# Module mapping: which files belong to which module
MODULE_MAPPING = {
    "auth": {
        "routes": ["app/api/auth.py"],
        "services": ["app/services/auth_service.py", "app/services/oauth_service.py"],
        "models": ["app/models/user.py"],
        "schemas": ["app/schemas/auth.py"],
    },
    "chargers": {
        "routes": ["app/api/chargers.py"],
        "services": ["app/services/charger_service.py", "app/services/s3_service.py"],
        "models": ["app/models/charger.py"],
        "schemas": ["app/schemas/charger.py"],
    },
    "routing": {
        "routes": ["app/api/routing.py"],
        "services": ["app/services/routing_service.py", "app/services/weather_service.py"],
        "models": ["app/models/routing.py"],
        "schemas": ["app/schemas/routing.py"],
    },
    "gamification": {
        "routes": [],  # Will use new structure
        "services": ["app/services/gamification_service.py"],
        "models": ["app/models/coin.py"],
        "schemas": [],
    },
    "profile": {
        "routes": ["app/api/profile.py"],
        "services": ["app/services/profile_service.py"],
        "models": [],  # Uses user model from auth
        "schemas": ["app/schemas/profile.py"],
    },
    "analytics": {
        "routes": ["app/api/analytics.py"],
        "services": ["app/services/analytics_service.py"],
        "models": [],
        "schemas": [],
    },
}


def create_module_structure():
    """Create the directory structure for all modules"""
    modules = ["auth", "chargers", "routing", "gamification", "profile", "analytics"]
    layers = ["domain", "application", "infrastructure", "presentation"]

    for module in modules:
        module_path = MODULES_PATH / module
        for layer in layers:
            layer_path = module_path / layer
            layer_path.mkdir(parents=True, exist_ok=True)

            # Create __init__.py files
            (layer_path / "__init__.py").touch()

        # Create module __init__.py
        (module_path / "__init__.py").touch()

    print("✅ Created module directory structure")


def backup_old_code():
    """Create a backup of the old code"""
    backup_path = BACKEND_PATH / "app_backup"
    if backup_path.exists():
        print(f"⚠️  Backup already exists at {backup_path}")
        return

    shutil.copytree(APP_PATH, backup_path)
    print(f"✅ Backed up existing code to {backup_path}")


def migrate_routes_to_presentation(module: str, route_files: List[str]):
    """Migrate API route files to presentation layer"""
    for route_file in route_files:
        source = BACKEND_PATH / route_file
        if not source.exists():
            print(f"⚠️  Route file not found: {route_file}")
            continue

        dest = MODULES_PATH / module / "presentation" / "routes.py"
        shutil.copy2(source, dest)
        print(f"✅ Migrated {route_file} -> {module}/presentation/routes.py")


def migrate_services_to_application(module: str, service_files: List[str]):
    """Migrate service files to application layer"""
    for service_file in service_files:
        source = BACKEND_PATH / service_file
        if not source.exists():
            print(f"⚠️  Service file not found: {service_file}")
            continue

        filename = Path(service_file).name
        dest = MODULES_PATH / module / "application" / filename
        shutil.copy2(source, dest)
        print(f"✅ Migrated {service_file} -> {module}/application/{filename}")


def migrate_models_to_domain(module: str, model_files: List[str]):
    """Migrate model files to domain layer"""
    for model_file in model_files:
        source = BACKEND_PATH / model_file
        if not source.exists():
            print(f"⚠️  Model file not found: {model_file}")
            continue

        filename = Path(model_file).name
        dest = MODULES_PATH / module / "domain" / filename
        shutil.copy2(source, dest)
        print(f"✅ Migrated {model_file} -> {module}/domain/{filename}")


def migrate_schemas_to_presentation(module: str, schema_files: List[str]):
    """Migrate schema files to presentation layer"""
    for schema_file in schema_files:
        source = BACKEND_PATH / schema_file
        if not source.exists():
            print(f"⚠️  Schema file not found: {schema_file}")
            continue

        filename = Path(schema_file).name
        dest = MODULES_PATH / module / "presentation" / filename
        shutil.copy2(source, dest)
        print(f"✅ Migrated {schema_file} -> {module}/presentation/{filename}")


def update_imports_in_file(filepath: Path, module_name: str):
    """Update imports in a migrated file"""
    if not filepath.exists():
        return

    content = filepath.read_text()

    # Common import replacements
    replacements = {
        "from ..models.": f"from modules.{module_name}.domain.",
        "from ..schemas.": f"from modules.{module_name}.presentation.",
        "from ..services.": f"from modules.{module_name}.application.",
        "from ..core.": "from app.core.",
        "from app.models.": f"from modules.{module_name}.domain.",
        "from app.schemas.": f"from modules.{module_name}.presentation.",
        "from app.services.": f"from modules.{module_name}.application.",
    }

    for old, new in replacements.items():
        content = content.replace(old, new)

    filepath.write_text(content)


def migrate_module(module: str, files: Dict[str, List[str]]):
    """Migrate a complete module"""
    print(f"\n🔄 Migrating {module} module...")

    # Migrate routes
    if files.get("routes"):
        migrate_routes_to_presentation(module, files["routes"])

    # Migrate services
    if files.get("services"):
        migrate_services_to_application(module, files["services"])

    # Migrate models
    if files.get("models"):
        migrate_models_to_domain(module, files["models"])

    # Migrate schemas
    if files.get("schemas"):
        migrate_schemas_to_presentation(module, files["schemas"])

    print(f"✅ {module} module migration complete")


def create_module_routers():
    """Create router aggregation files for each module"""
    router_template = '''"""
{module_title} Module Router

Aggregates all {module} endpoints.
"""

from fastapi import APIRouter

# Import from existing routes (to be refactored)
try:
    from .routes import router as {module}_router
except ImportError:
    {module}_router = APIRouter(prefix="/api/{module}", tags=["{module_title}"])

# Export router
router = {module}_router
'''

    modules_info = {
        "auth": "Authentication",
        "chargers": "Chargers",
        "routing": "Routing",
        "profile": "Profile",
        "analytics": "Analytics",
    }

    for module, title in modules_info.items():
        router_file = MODULES_PATH / module / "presentation" / "router.py"
        content = router_template.format(module=module, module_title=title)
        router_file.write_text(content)
        print(f"✅ Created router for {module}")


def create_new_main():
    """Create updated main.py that uses new module structure"""
    main_template = '''"""
SharaSpot Backend - Modular Monolith Architecture

This is the main entry point that aggregates all module routers.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.middleware import setup_middleware
from app.core.config import settings
from container import configure_container

# Import module routers
from modules.auth.presentation.router import router as auth_router
from modules.chargers.presentation.router import router as chargers_router
from modules.routing.presentation.router import router as routing_router
from modules.profile.presentation.router import router as profile_router
from modules.analytics.presentation.router import router as analytics_router
from modules.gamification.presentation.routes import router as gamification_router

# Initialize FastAPI
app = FastAPI(
    title="SharaSpot API",
    description="Modular Monolith Architecture",
    version="2.0.0",
)

# Configure dependency injection
configure_container()

# Setup middleware
setup_middleware(app)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include module routers
app.include_router(auth_router)
app.include_router(chargers_router)
app.include_router(routing_router)
app.include_router(profile_router)
app.include_router(analytics_router)
app.include_router(gamification_router)

@app.get("/")
async def root():
    return {
        "message": "SharaSpot API - Modular Monolith",
        "version": "2.0.0",
        "architecture": "Modular Monolith with Domain-Driven Design"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
'''

    new_main = BACKEND_PATH / "main_modular.py"
    new_main.write_text(main_template)
    print(f"✅ Created {new_main}")


def main():
    """Main migration function"""
    print("=" * 60)
    print("SharaSpot Backend Migration to Modular Monolith")
    print("=" * 60)

    # Step 1: Create module structure
    print("\n📁 Step 1: Creating module structure...")
    create_module_structure()

    # Step 2: Backup old code
    print("\n💾 Step 2: Backing up existing code...")
    backup_old_code()

    # Step 3: Migrate modules
    print("\n🔄 Step 3: Migrating modules...")
    for module, files in MODULE_MAPPING.items():
        migrate_module(module, files)

    # Step 4: Create module routers
    print("\n📋 Step 4: Creating module routers...")
    create_module_routers()

    # Step 5: Create new main.py
    print("\n📄 Step 5: Creating new main.py...")
    create_new_main()

    print("\n" + "=" * 60)
    print("✅ Migration Complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Review migrated code in backend/modules/")
    print("2. Update imports in migrated files")
    print("3. Test with: uvicorn main_modular:app --reload")
    print("4. Once verified, replace main.py with main_modular.py")
    print("\nOriginal code backed up to: backend/app_backup/")
    print("=" * 60)


if __name__ == "__main__":
    main()
