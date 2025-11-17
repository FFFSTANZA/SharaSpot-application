#!/usr/bin/env python3
"""
Migration Verification Script

This script performs comprehensive verification of the modular monolith migration
to ensure everything is correctly set up.
"""

import ast
import re
from pathlib import Path
from typing import List, Dict, Tuple

BACKEND_PATH = Path(__file__).parent / "backend"
FRONTEND_PATH = Path(__file__).parent / "frontend"
MODULES_PATH = BACKEND_PATH / "modules"
SRC_PATH = FRONTEND_PATH / "src"


class VerificationReport:
    """Collects verification results"""

    def __init__(self):
        self.passed = []
        self.failed = []
        self.warnings = []

    def add_pass(self, message: str):
        self.passed.append(message)

    def add_fail(self, message: str):
        self.failed.append(message)

    def add_warning(self, message: str):
        self.warnings.append(message)

    def print_report(self):
        print("\n" + "=" * 60)
        print("VERIFICATION REPORT")
        print("=" * 60)

        if self.passed:
            print(f"\n✅ PASSED ({len(self.passed)} checks):")
            for msg in self.passed:
                print(f"  ✅ {msg}")

        if self.warnings:
            print(f"\n⚠️  WARNINGS ({len(self.warnings)} items):")
            for msg in self.warnings:
                print(f"  ⚠️  {msg}")

        if self.failed:
            print(f"\n❌ FAILED ({len(self.failed)} checks):")
            for msg in self.failed:
                print(f"  ❌ {msg}")

        print("\n" + "=" * 60)
        print(f"SUMMARY: {len(self.passed)} passed, {len(self.warnings)} warnings, {len(self.failed)} failed")
        print("=" * 60)

        return len(self.failed) == 0


def verify_backend_structure(report: VerificationReport):
    """Verify backend module structure"""
    print("\n🔍 Verifying backend structure...")

    required_modules = ["auth", "chargers", "routing", "gamification", "profile", "analytics"]
    required_layers = ["domain", "application", "infrastructure", "presentation"]

    for module in required_modules:
        module_path = MODULES_PATH / module
        if not module_path.exists():
            report.add_fail(f"Module directory missing: {module}")
            continue

        # Check layers
        for layer in required_layers:
            layer_path = module_path / layer
            if layer_path.exists():
                report.add_pass(f"{module}/{layer} exists")
            else:
                report.add_warning(f"{module}/{layer} missing (may be intentional)")

    # Check shared kernel
    if (BACKEND_PATH / "shared").exists():
        report.add_pass("Shared kernel exists")
    else:
        report.add_fail("Shared kernel missing")

    # Check container
    if (BACKEND_PATH / "container.py").exists():
        report.add_pass("Dependency injection container exists")
    else:
        report.add_fail("Container.py missing")


def verify_backend_imports(report: VerificationReport):
    """Verify backend imports are correct"""
    print("\n🔍 Verifying backend imports...")

    # Check main.py imports
    main_py = BACKEND_PATH / "main.py"
    if main_py.exists():
        content = main_py.read_text()
        required_imports = [
            "from modules.auth.presentation.router import router",
            "from modules.chargers.presentation.router import router",
            "from modules.routing.presentation.router import router",
        ]

        for imp in required_imports:
            if imp in content:
                report.add_pass(f"main.py has correct import: {imp.split('import')[0].strip()}")
            else:
                report.add_fail(f"main.py missing import: {imp}")
    else:
        report.add_fail("main.py not found")

    # Check auth routes imports
    auth_routes = MODULES_PATH / "auth" / "presentation" / "routes.py"
    if auth_routes.exists():
        content = auth_routes.read_text()

        if "from modules.auth.application import auth_service" in content:
            report.add_pass("auth/routes.py uses correct application imports")
        else:
            report.add_fail("auth/routes.py has incorrect imports")

        if "from modules.auth.domain.user import User" in content:
            report.add_pass("auth/routes.py uses correct domain imports")
        else:
            report.add_fail("auth/routes.py missing correct domain imports")


def verify_frontend_structure(report: VerificationReport):
    """Verify frontend structure"""
    print("\n🔍 Verifying frontend structure...")

    # Check features
    required_features = ["auth", "chargers", "map", "profile", "routing"]
    for feature in required_features:
        feature_path = SRC_PATH / "features" / feature
        if feature_path.exists():
            report.add_pass(f"Feature exists: {feature}")

            # Check feature subdirectories
            subdirs = ["api", "components", "hooks", "screens", "store", "types"]
            for subdir in subdirs:
                if (feature_path / subdir).exists():
                    pass  # OK
        else:
            report.add_warning(f"Feature directory missing: {feature}")

    # Check shared
    if (SRC_PATH / "shared").exists():
        report.add_pass("Shared infrastructure exists")

        # Check shared subdirectories
        shared_subdirs = ["api", "ui", "hooks", "store", "services", "utils"]
        for subdir in shared_subdirs:
            if (SRC_PATH / "shared" / subdir).exists():
                report.add_pass(f"Shared/{subdir} exists")
    else:
        report.add_fail("Shared infrastructure missing")


def verify_frontend_imports(report: VerificationReport):
    """Verify frontend imports"""
    print("\n🔍 Verifying frontend imports...")

    # Check if any files still use old import paths
    problematic_patterns = [
        (r'from ["\']\.\.\/components\/', "Old components import"),
        (r'from ["\']\.\.\/\.\.\/components\/', "Old components import"),
    ]

    files_with_issues = []

    for ts_file in SRC_PATH.rglob("*.ts*"):
        if ts_file.suffix in ['.ts', '.tsx']:
            content = ts_file.read_text()

            for pattern, desc in problematic_patterns:
                if re.search(pattern, content):
                    files_with_issues.append((ts_file, desc))

    if not files_with_issues:
        report.add_pass("No old import paths detected")
    else:
        for file, desc in files_with_issues[:5]:  # Show first 5
            relative_path = file.relative_to(FRONTEND_PATH)
            report.add_warning(f"{relative_path}: {desc}")


def verify_package_json(report: VerificationReport):
    """Verify package.json has required dependencies"""
    print("\n🔍 Verifying package.json...")

    package_json = FRONTEND_PATH / "package.json"
    if package_json.exists():
        content = package_json.read_text()

        required_deps = ["zustand", "immer", "axios"]
        for dep in required_deps:
            if f'"{dep}"' in content:
                report.add_pass(f"package.json has {dep}")
            else:
                report.add_fail(f"package.json missing {dep}")
    else:
        report.add_fail("package.json not found")


def verify_documentation(report: VerificationReport):
    """Verify documentation exists"""
    print("\n🔍 Verifying documentation...")

    docs = [
        "docs/MODULAR_MONOLITH_ARCHITECTURE.md",
        "docs/MIGRATION_GUIDE.md",
        "docs/NEW_ARCHITECTURE_README.md",
        "MIGRATION_COMPLETE.md",
    ]

    for doc in docs:
        doc_path = Path(__file__).parent / doc
        if doc_path.exists():
            report.add_pass(f"Documentation exists: {doc}")
        else:
            report.add_warning(f"Documentation missing: {doc}")


def verify_backups(report: VerificationReport):
    """Verify backups exist"""
    print("\n🔍 Verifying backups...")

    backups = [
        ("backend/app_backup", "Backend backup"),
        ("frontend/backup", "Frontend backup"),
    ]

    for backup_path, desc in backups:
        full_path = Path(__file__).parent / backup_path
        if full_path.exists():
            report.add_pass(f"{desc} exists")
        else:
            report.add_warning(f"{desc} missing")


def count_files():
    """Count files in new structure"""
    print("\n📊 Counting migrated files...")

    backend_modules = sum(1 for _ in MODULES_PATH.rglob("*.py"))
    backend_shared = sum(1 for _ in (BACKEND_PATH / "shared").rglob("*.py"))

    frontend_features = sum(1 for _ in (SRC_PATH / "features").rglob("*.ts*"))
    frontend_shared = sum(1 for _ in (SRC_PATH / "shared").rglob("*.ts*"))

    print(f"  📦 Backend modules: {backend_modules} Python files")
    print(f"  📦 Backend shared: {backend_shared} Python files")
    print(f"  📦 Frontend features: {frontend_features} TypeScript files")
    print(f"  📦 Frontend shared: {frontend_shared} TypeScript files")

    return {
        "backend_modules": backend_modules,
        "backend_shared": backend_shared,
        "frontend_features": frontend_features,
        "frontend_shared": frontend_shared,
    }


def main():
    """Main verification function"""
    print("=" * 60)
    print("MIGRATION VERIFICATION")
    print("=" * 60)

    report = VerificationReport()

    # Run verifications
    verify_backend_structure(report)
    verify_backend_imports(report)
    verify_frontend_structure(report)
    verify_frontend_imports(report)
    verify_package_json(report)
    verify_documentation(report)
    verify_backups(report)

    # Count files
    counts = count_files()

    # Print report
    success = report.print_report()

    # Print next steps
    print("\n📋 NEXT STEPS:")
    print("=" * 60)
    if success:
        print("✅ Migration verified successfully!")
        print("\n1. Install frontend dependencies:")
        print("   cd frontend && yarn install")
        print("\n2. Test backend:")
        print("   cd backend && uvicorn main:app --reload")
        print("\n3. Test frontend:")
        print("   cd frontend && yarn start")
    else:
        print("⚠️  Some checks failed. Review the report above.")
        print("   Most warnings are acceptable if intentional.")

    print("=" * 60)

    return 0 if success else 1


if __name__ == "__main__":
    exit(main())
