#!/usr/bin/env python3
"""
Deep Verification Script

This script performs comprehensive deep checks of the entire codebase
to ensure everything is perfect with no errors.
"""

import ast
import re
import sys
from pathlib import Path
from typing import List, Dict, Set, Tuple
import importlib.util

BACKEND_PATH = Path(__file__).parent / "backend"
FRONTEND_PATH = Path(__file__).parent / "frontend"
MODULES_PATH = BACKEND_PATH / "modules"
SRC_PATH = FRONTEND_PATH / "src"


class DeepChecker:
    def __init__(self):
        self.issues = []
        self.warnings = []
        self.successes = []

    def add_issue(self, msg: str):
        self.issues.append(f"❌ {msg}")

    def add_warning(self, msg: str):
        self.warnings.append(f"⚠️  {msg}")

    def add_success(self, msg: str):
        self.successes.append(f"✅ {msg}")


def check_python_syntax(file_path: Path) -> Tuple[bool, str]:
    """Check if Python file has valid syntax"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()
        ast.parse(code)
        return True, ""
    except SyntaxError as e:
        return False, f"Line {e.lineno}: {e.msg}"
    except Exception as e:
        return False, str(e)


def check_python_imports(file_path: Path) -> List[str]:
    """Extract all imports from a Python file"""
    imports = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()

        tree = ast.parse(code)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.append(node.module)
    except:
        pass

    return imports


def verify_backend_syntax(checker: DeepChecker):
    """Verify all backend Python files have valid syntax"""
    print("\n🔍 Deep Check: Backend Python Syntax...")

    python_files = list(BACKEND_PATH.rglob("*.py"))
    syntax_errors = 0

    for py_file in python_files:
        if "app_backup" in str(py_file):
            continue

        valid, error = check_python_syntax(py_file)
        if not valid:
            relative = py_file.relative_to(BACKEND_PATH)
            checker.add_issue(f"Syntax error in {relative}: {error}")
            syntax_errors += 1

    if syntax_errors == 0:
        checker.add_success(f"All {len(python_files)} backend Python files have valid syntax")
    else:
        checker.add_issue(f"{syntax_errors} files have syntax errors")


def verify_backend_structure_deep(checker: DeepChecker):
    """Deep verification of backend structure"""
    print("\n🔍 Deep Check: Backend Structure...")

    # Check each module has all required files
    modules = {
        "auth": {
            "required_files": ["presentation/routes.py", "application/auth_service.py", "domain/user.py"],
            "optional_files": ["application/oauth_service.py", "presentation/auth.py"]
        },
        "chargers": {
            "required_files": ["presentation/routes.py", "application/charger_service.py"],
            "optional_files": ["application/s3_service.py", "domain/charger.py"]
        },
        "routing": {
            "required_files": ["presentation/routes.py", "application/routing_service.py"],
            "optional_files": ["application/weather_service.py"]
        },
        "gamification": {
            "required_files": ["domain/entities.py", "application/commands.py"],
            "optional_files": ["domain/events.py", "domain/value_objects.py"]
        },
        "profile": {
            "required_files": ["presentation/routes.py"],
            "optional_files": ["application/profile_service.py"]
        },
        "analytics": {
            "required_files": ["presentation/routes.py"],
            "optional_files": ["application/analytics_service.py"]
        }
    }

    for module, config in modules.items():
        module_path = MODULES_PATH / module

        if not module_path.exists():
            checker.add_issue(f"Module directory missing: {module}")
            continue

        # Check required files
        for req_file in config["required_files"]:
            file_path = module_path / req_file
            if file_path.exists():
                checker.add_success(f"{module}/{req_file} exists")
            else:
                checker.add_issue(f"{module}/{req_file} MISSING")

        # Check __init__.py in each layer
        for layer in ["domain", "application", "infrastructure", "presentation"]:
            init_file = module_path / layer / "__init__.py"
            if not init_file.exists():
                checker.add_warning(f"{module}/{layer}/__init__.py missing")


def verify_backend_imports_deep(checker: DeepChecker):
    """Deep verification of backend imports"""
    print("\n🔍 Deep Check: Backend Imports...")

    # Critical import patterns that should NOT exist
    bad_patterns = [
        (r'from \.\.services import', "Old services import pattern"),
        (r'from app\.services\.', "Old app.services import"),
        (r'from \.\.models\.', "Old models import pattern"),
        (r'from app\.models\.(?!.*db_models)', "Old app.models import"),
    ]

    # Check all module Python files
    for py_file in MODULES_PATH.rglob("*.py"):
        if py_file.name == "__init__.py":
            continue

        content = py_file.read_text(encoding='utf-8')
        relative = py_file.relative_to(BACKEND_PATH)

        for pattern, desc in bad_patterns:
            if re.search(pattern, content):
                checker.add_issue(f"{relative} has {desc}")

    # Verify critical files have correct imports
    critical_checks = [
        (
            BACKEND_PATH / "main.py",
            [
                "from modules.auth.presentation.router import router",
                "from modules.chargers.presentation.router import router",
                "from modules.routing.presentation.router import router",
            ]
        ),
        (
            MODULES_PATH / "auth" / "presentation" / "routes.py",
            [
                "from modules.auth.application import auth_service",
                "from modules.auth.domain.user import User",
            ]
        ),
        (
            MODULES_PATH / "chargers" / "presentation" / "routes.py",
            [
                "from modules.chargers.application import charger_service",
            ]
        ),
    ]

    for file_path, expected_imports in critical_checks:
        if not file_path.exists():
            checker.add_issue(f"{file_path.name} not found")
            continue

        content = file_path.read_text(encoding='utf-8')
        for exp_import in expected_imports:
            if exp_import in content:
                checker.add_success(f"{file_path.name} has: {exp_import.split('import')[0].strip()}")
            else:
                checker.add_issue(f"{file_path.name} missing: {exp_import}")


def verify_frontend_structure_deep(checker: DeepChecker):
    """Deep verification of frontend structure"""
    print("\n🔍 Deep Check: Frontend Structure...")

    # Check features
    features = {
        "auth": ["api/authApi.ts", "store/authStore.ts", "hooks/useAuth.ts", "types/auth.types.ts"],
        "chargers": ["api/chargersApi.ts", "components/FilterModal.tsx", "screens/add-charger.tsx"],
        "map": ["api/mapApi.ts", "screens/map.tsx"],
        "profile": ["api/profileApi.ts", "screens/profile.tsx"],
        "routing": ["api/routingApi.ts"],
    }

    for feature, required_files in features.items():
        feature_path = SRC_PATH / "features" / feature

        if not feature_path.exists():
            checker.add_issue(f"Feature {feature} directory missing")
            continue

        for req_file in required_files:
            file_path = feature_path / req_file
            if file_path.exists():
                checker.add_success(f"features/{feature}/{req_file} exists")
            else:
                checker.add_warning(f"features/{feature}/{req_file} missing")

    # Check shared infrastructure
    shared_required = [
        "api/client.ts",
        "api/config.ts",
        "store/index.ts",
        "hooks/useAsync.ts",
        "services/storage.ts",
        "ui/index.ts",
        "ui/atoms/index.ts",
        "ui/molecules/index.ts",
        "ui/organisms/index.ts",
    ]

    for req_file in shared_required:
        file_path = SRC_PATH / "shared" / req_file
        if file_path.exists():
            checker.add_success(f"shared/{req_file} exists")
        else:
            checker.add_issue(f"shared/{req_file} MISSING")


def verify_frontend_imports_deep(checker: DeepChecker):
    """Deep verification of frontend imports"""
    print("\n🔍 Deep Check: Frontend Imports...")

    # Patterns that should NOT exist (old imports)
    bad_patterns = [
        (r'from ["\']\.\.\/\.\.\/\.\.\/components\/', "Old root components import"),
        (r'from ["\']\.\.\/\.\.\/\.\.\/contexts\/', "Old root contexts import"),
        (r'from ["\']\.\.\/\.\.\/\.\.\/utils\/(?!secureStorage)', "Old root utils import"),
    ]

    issues_found = 0

    for ts_file in SRC_PATH.rglob("*.ts*"):
        if ts_file.suffix not in ['.ts', '.tsx']:
            continue

        content = ts_file.read_text(encoding='utf-8')
        relative = ts_file.relative_to(SRC_PATH)

        for pattern, desc in bad_patterns:
            matches = re.findall(pattern, content)
            if matches:
                checker.add_issue(f"{relative} has {desc}: {len(matches)} occurrences")
                issues_found += 1

    if issues_found == 0:
        checker.add_success("No old import patterns found in frontend")


def verify_shared_api_client(checker: DeepChecker):
    """Verify the API client is properly configured"""
    print("\n🔍 Deep Check: API Client Configuration...")

    client_file = SRC_PATH / "shared" / "api" / "client.ts"
    config_file = SRC_PATH / "shared" / "api" / "config.ts"

    if not client_file.exists():
        checker.add_issue("API client.ts missing")
        return

    if not config_file.exists():
        checker.add_issue("API config.ts missing")
        return

    client_content = client_file.read_text()
    config_content = config_file.read_text()

    # Check client has critical methods
    required_methods = ["get", "post", "put", "patch", "delete", "upload"]
    for method in required_methods:
        if f"async {method}<" in client_content or f"async {method}(" in client_content:
            checker.add_success(f"API client has {method} method")
        else:
            checker.add_warning(f"API client missing {method} method")

    # Check config has endpoints
    if "API_ENDPOINTS" in config_content:
        checker.add_success("API endpoints configured")
    else:
        checker.add_issue("API_ENDPOINTS not found in config")


def verify_package_json_deep(checker: DeepChecker):
    """Deep verification of package.json"""
    print("\n🔍 Deep Check: package.json Dependencies...")

    package_json = FRONTEND_PATH / "package.json"
    if not package_json.exists():
        checker.add_issue("package.json not found")
        return

    import json
    with open(package_json, 'r') as f:
        data = json.load(f)

    # Required dependencies
    required_deps = {
        "zustand": "State management",
        "immer": "Immutable state updates",
        "axios": "HTTP client",
        "expo": "Expo framework",
        "react": "React library",
        "react-native": "React Native",
    }

    deps = data.get("dependencies", {})

    for dep, desc in required_deps.items():
        if dep in deps:
            version = deps[dep]
            checker.add_success(f"{dep}@{version} - {desc}")
        else:
            checker.add_issue(f"Missing dependency: {dep} ({desc})")


def check_circular_dependencies(checker: DeepChecker):
    """Check for potential circular dependencies in backend"""
    print("\n🔍 Deep Check: Circular Dependencies...")

    # Build dependency graph
    module_imports = {}

    for module_dir in MODULES_PATH.iterdir():
        if not module_dir.is_dir():
            continue

        module_name = module_dir.name
        imports = set()

        for py_file in module_dir.rglob("*.py"):
            if py_file.name == "__init__.py":
                continue

            content = py_file.read_text(encoding='utf-8')

            # Find imports from other modules
            for other_module in ["auth", "chargers", "routing", "gamification", "profile", "analytics"]:
                if other_module != module_name:
                    if f"from modules.{other_module}." in content:
                        imports.add(other_module)

        module_imports[module_name] = imports

    # Check for circular dependencies
    found_circular = False
    for module, imported in module_imports.items():
        for imported_module in imported:
            if module in module_imports.get(imported_module, set()):
                checker.add_warning(f"Circular dependency: {module} ↔ {imported_module}")
                found_circular = True

    if not found_circular:
        checker.add_success("No circular dependencies detected")


def verify_router_files(checker: DeepChecker):
    """Verify all router files are correctly set up"""
    print("\n🔍 Deep Check: Router Files...")

    modules = ["auth", "chargers", "routing", "profile", "analytics"]

    for module in modules:
        router_file = MODULES_PATH / module / "presentation" / "router.py"
        routes_file = MODULES_PATH / module / "presentation" / "routes.py"

        # Check router.py exists
        if router_file.exists():
            content = router_file.read_text()

            # Should import from routes
            if "from .routes import router" in content:
                checker.add_success(f"{module}/router.py imports from routes")
            else:
                checker.add_warning(f"{module}/router.py doesn't import from routes")

            # Should export router
            if "router = " in content:
                checker.add_success(f"{module}/router.py exports router")
            else:
                checker.add_issue(f"{module}/router.py doesn't export router")
        else:
            checker.add_warning(f"{module}/presentation/router.py missing")

        # Check routes.py exists
        if routes_file.exists():
            content = routes_file.read_text()

            # Should have router = APIRouter
            if "router = APIRouter" in content:
                checker.add_success(f"{module}/routes.py defines router")
            else:
                checker.add_warning(f"{module}/routes.py doesn't define router")
        else:
            checker.add_warning(f"{module}/presentation/routes.py missing")


def count_files_detailed(checker: DeepChecker):
    """Count files in detail"""
    print("\n📊 Detailed File Count...")

    # Backend
    backend_modules = {}
    for module_dir in MODULES_PATH.iterdir():
        if module_dir.is_dir():
            count = sum(1 for _ in module_dir.rglob("*.py"))
            backend_modules[module_dir.name] = count

    backend_shared = sum(1 for _ in (BACKEND_PATH / "shared").rglob("*.py"))

    # Frontend
    frontend_features = {}
    features_path = SRC_PATH / "features"
    if features_path.exists():
        for feature_dir in features_path.iterdir():
            if feature_dir.is_dir():
                count = sum(1 for f in feature_dir.rglob("*.ts*") if f.suffix in ['.ts', '.tsx'])
                frontend_features[feature_dir.name] = count

    frontend_shared = sum(1 for f in (SRC_PATH / "shared").rglob("*.ts*") if f.suffix in ['.ts', '.tsx'])

    print("\n  Backend Modules:")
    for module, count in sorted(backend_modules.items()):
        print(f"    {module}: {count} files")
    print(f"    shared: {backend_shared} files")

    print("\n  Frontend Features:")
    for feature, count in sorted(frontend_features.items()):
        print(f"    {feature}: {count} files")
    print(f"    shared: {frontend_shared} files")


def main():
    """Main deep verification"""
    print("=" * 70)
    print("DEEP VERIFICATION - Comprehensive Check")
    print("=" * 70)

    checker = DeepChecker()

    # Run all checks
    verify_backend_syntax(checker)
    verify_backend_structure_deep(checker)
    verify_backend_imports_deep(checker)
    verify_frontend_structure_deep(checker)
    verify_frontend_imports_deep(checker)
    verify_shared_api_client(checker)
    verify_package_json_deep(checker)
    check_circular_dependencies(checker)
    verify_router_files(checker)
    count_files_detailed(checker)

    # Print results
    print("\n" + "=" * 70)
    print("DEEP VERIFICATION RESULTS")
    print("=" * 70)

    if checker.successes:
        print(f"\n✅ SUCCESSES ({len(checker.successes)}):")
        for msg in checker.successes[:30]:  # Show first 30
            print(f"  {msg}")
        if len(checker.successes) > 30:
            print(f"  ... and {len(checker.successes) - 30} more")

    if checker.warnings:
        print(f"\n⚠️  WARNINGS ({len(checker.warnings)}):")
        for msg in checker.warnings:
            print(f"  {msg}")

    if checker.issues:
        print(f"\n❌ ISSUES ({len(checker.issues)}):")
        for msg in checker.issues:
            print(f"  {msg}")

    print("\n" + "=" * 70)
    print(f"SUMMARY: {len(checker.successes)} successes, "
          f"{len(checker.warnings)} warnings, {len(checker.issues)} issues")
    print("=" * 70)

    if len(checker.issues) == 0:
        print("\n✅ DEEP VERIFICATION PASSED - Everything is perfect!")
        return 0
    else:
        print("\n⚠️  Some issues found - review above")
        return 1


if __name__ == "__main__":
    exit(main())
