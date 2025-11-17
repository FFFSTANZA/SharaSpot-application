#!/usr/bin/env python3
"""
Frontend Import Fixer

This script fixes all imports in the frontend to use the correct paths
in the new modular structure.
"""

import re
from pathlib import Path
from typing import List, Tuple

FRONTEND_PATH = Path(__file__).parent / "frontend"
SRC_PATH = FRONTEND_PATH / "src"

def calculate_relative_path(from_file: Path, to_module: str) -> str:
    """Calculate the correct relative path from a file to a shared module"""
    # Get depth of current file
    relative_to_src = from_file.relative_to(SRC_PATH)
    depth = len(relative_to_src.parts) - 1  # -1 for the file itself

    # Build relative path
    if depth == 0:
        return f"./{to_module}"
    else:
        return "../" * depth + to_module


def fix_imports_in_file(file_path: Path) -> bool:
    """Fix imports in a TypeScript/TSX file"""
    if not file_path.exists():
        return False

    content = file_path.read_text(encoding='utf-8')
    original_content = content

    # Determine file location
    relative_to_src = file_path.relative_to(SRC_PATH)
    depth = len(relative_to_src.parts) - 1

    # Build correct paths to shared modules
    shared_prefix = "../" * depth + "shared"

    # Common import fixes
    import_fixes = [
        # Utils imports
        (r"from ['\"]\.\.\/utils\/secureStorage['\"]", f"from '{shared_prefix}/utils/secureStorage'"),
        (r"from ['\"]\.\.\/\.\.\/utils\/secureStorage['\"]", f"from '{shared_prefix}/utils/secureStorage'"),
        (r"from ['\"]\.\.\/\.\.\/\.\.\/utils\/secureStorage['\"]", f"from '{shared_prefix}/utils/secureStorage'"),

        # Constants imports
        (r"from ['\"]\.\.\/constants\/theme['\"]", f"from '{shared_prefix}/constants/theme'"),
        (r"from ['\"]\.\.\/\.\.\/constants\/theme['\"]", f"from '{shared_prefix}/constants/theme'"),

        # Components/ui imports - update to use shared/ui
        (r"from ['\"]\.\.\/components\/ui\/([^'\"]+)['\"]", f"from '{shared_prefix}/ui/\\1'"),
        (r"from ['\"]\.\.\/\.\.\/components\/ui\/([^'\"]+)['\"]", f"from '{shared_prefix}/ui/\\1'"),

        # Contexts -> features (AuthContext)
        (r"from ['\"]\.\.\/\.\.\/contexts\/AuthContext['\"]", f"from '{shared_prefix}/../features/auth'"),
        (r"from ['\"]\.\.\/contexts\/AuthContext['\"]", f"from '{shared_prefix}/../features/auth'"),
    ]

    for pattern, replacement in import_fixes:
        content = re.sub(pattern, replacement, content)

    # Save if changed
    if content != original_content:
        file_path.write_text(content, encoding='utf-8')
        return True

    return False


def create_theme_constants():
    """Create theme constants file if it doesn't exist"""
    constants_dir = SRC_PATH / "shared" / "constants"
    constants_dir.mkdir(parents=True, exist_ok=True)

    theme_file = constants_dir / "theme.ts"
    if theme_file.exists():
        return

    # Check if old theme exists
    old_theme = FRONTEND_PATH / "constants" / "theme.ts"
    if old_theme.exists():
        # Copy it
        import shutil
        shutil.copy2(old_theme, theme_file)
        print(f"  ✅ Copied theme.ts to shared/constants/")
    else:
        # Create a basic theme
        theme_content = '''/**
 * Theme Constants
 *
 * Color palette and design tokens.
 */

export const Colors = {
  primary: '#4F46E5',
  secondary: '#10B981',
  background: '#FFFFFF',
  text: '#111827',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
  },
};
'''
        theme_file.write_text(theme_content)
        print(f"  ✅ Created theme.ts in shared/constants/")


def fix_all_frontend_imports():
    """Fix imports in all frontend files"""
    print("🔧 Fixing frontend imports...\n")

    # Create theme constants if needed
    create_theme_constants()

    fixed_count = 0

    # Fix imports in all TypeScript/TSX files
    for ts_file in SRC_PATH.rglob("*.ts*"):
        if ts_file.suffix in ['.ts', '.tsx']:
            if fix_imports_in_file(ts_file):
                fixed_count += 1
                relative_path = ts_file.relative_to(FRONTEND_PATH)
                print(f"  ✅ Fixed {relative_path}")

    print(f"\n✅ Fixed imports in {fixed_count} frontend files")


def create_tsconfig_paths():
    """Create/update tsconfig.json with path mappings for easier imports"""
    tsconfig_path = FRONTEND_PATH / "tsconfig.json"

    if not tsconfig_path.exists():
        print("\n⚠️  tsconfig.json not found, creating one...")
        tsconfig_content = '''{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"],
      "@features/*": ["src/features/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}
'''
        tsconfig_path.write_text(tsconfig_content)
        print("  ✅ Created tsconfig.json with path mappings")
    else:
        print("\n✅ tsconfig.json exists (update paths manually if needed)")


def verify_critical_frontend_files():
    """Verify critical frontend files"""
    print("\n🔍 Verifying frontend files...\n")

    critical_files = [
        "src/shared/api/client.ts",
        "src/shared/api/config.ts",
        "src/shared/store/index.ts",
        "src/features/auth/index.ts",
        "src/shared/ui/index.ts",
    ]

    all_good = True
    for file_path in critical_files:
        full_path = FRONTEND_PATH / file_path
        if full_path.exists():
            print(f"  ✅ {file_path}")
        else:
            print(f"  ❌ {file_path} missing")
            all_good = False

    return all_good


def main():
    """Main function"""
    print("=" * 60)
    print("Frontend Import Fixer")
    print("=" * 60)

    # Fix imports
    fix_all_frontend_imports()

    # Create tsconfig paths
    create_tsconfig_paths()

    # Verify files
    print("\n" + "=" * 60)
    if verify_critical_frontend_files():
        print("\n✅ All frontend files verified!")
    else:
        print("\n⚠️  Some files need attention")

    print("=" * 60)
    print("\n✨ Frontend import fixing complete!")
    print("\nNext: Install dependencies and test:")
    print("  cd frontend && yarn install && yarn start")
    print("=" * 60)


if __name__ == "__main__":
    main()
