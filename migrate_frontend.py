#!/usr/bin/env python3
"""
Automated Frontend Migration Script

This script migrates the existing frontend code structure to the new feature-based architecture.
It preserves all functionality while reorganizing code into proper feature modules.
"""

import os
import shutil
from pathlib import Path
from typing import Dict, List

# Define paths
FRONTEND_PATH = Path(__file__).parent / "frontend"
SRC_PATH = FRONTEND_PATH / "src"
APP_PATH = FRONTEND_PATH / "app"
COMPONENTS_PATH = FRONTEND_PATH / "components"
CONTEXTS_PATH = FRONTEND_PATH / "contexts"
UTILS_PATH = FRONTEND_PATH / "utils"

# Feature mapping: which components belong to which feature
FEATURE_MAPPING = {
    "chargers": {
        "components": [
            "components/FilterModal.tsx",
            "components/EnhancedVerificationModal.tsx",
            "components/VerificationReportModal.tsx",
            "components/VerificationBadge.tsx",
            "components/AmenitiesIcons.tsx",
        ],
        "screens": [
            "app/add-charger.tsx",
            "app/charger-detail.tsx",
            "app/verify-station.tsx",
            "app/verification-report.tsx",
        ],
    },
    "map": {
        "components": [],
        "screens": [
            "app/(tabs)/map.tsx",
        ],
    },
    "profile": {
        "components": [
            "components/PremiumCard.tsx",
        ],
        "screens": [
            "app/(tabs)/profile.tsx",
            "app/profile.tsx",
        ],
    },
}

# UI components to move to shared
SHARED_UI_COMPONENTS = {
    "atoms": [
        "components/ui/AnimatedCheckbox.tsx",
        "components/ui/AnimatedRadio.tsx",
    ],
    "molecules": [
        "components/ui/FloatingInput.tsx",
        "components/ui/CustomRefreshControl.tsx",
    ],
    "organisms": [
        "components/ui/AnimatedCard.tsx",
        "components/ui/AnimatedListItem.tsx",
        "components/ui/AnimatedButton.tsx",
        "components/ui/ChartCard.tsx",
        "components/ui/ElectricButton.tsx",
        "components/ui/GlassCard.tsx",
        "components/ui/ProgressRing.tsx",
        "components/ui/PulseIndicator.tsx",
        "components/ui/ShimmerLoader.tsx",
        "components/ui/StatCard.tsx",
        "components/ui/SuccessAnimation.tsx",
    ],
}


def create_feature_structure():
    """Create the directory structure for all features"""
    features = ["chargers", "map", "profile", "routing"]

    for feature in features:
        feature_path = SRC_PATH / "features" / feature
        subdirs = ["api", "components", "hooks", "screens", "store", "types"]

        for subdir in subdirs:
            (feature_path / subdir).mkdir(parents=True, exist_ok=True)

        # Create index.ts
        (feature_path / "index.ts").touch()

    print("✅ Created feature directory structure")


def create_shared_structure():
    """Create shared infrastructure structure"""
    shared_path = SRC_PATH / "shared"

    # Already created: api, hooks, store, services
    # Create UI component structure
    ui_path = shared_path / "ui"
    for category in ["atoms", "molecules", "organisms"]:
        (ui_path / category).mkdir(parents=True, exist_ok=True)

    # Create other shared directories
    for dir_name in ["types", "constants", "utils"]:
        (shared_path / dir_name).mkdir(parents=True, exist_ok=True)

    print("✅ Created shared directory structure")


def backup_old_code():
    """Create a backup of existing code"""
    backup_path = FRONTEND_PATH / "backup"
    if backup_path.exists():
        print(f"⚠️  Backup already exists at {backup_path}")
        return

    # Backup components
    if COMPONENTS_PATH.exists():
        shutil.copytree(COMPONENTS_PATH, backup_path / "components")

    # Backup contexts
    if CONTEXTS_PATH.exists():
        shutil.copytree(CONTEXTS_PATH, backup_path / "contexts")

    # Backup utils
    if UTILS_PATH.exists():
        shutil.copytree(UTILS_PATH, backup_path / "utils")

    print(f"✅ Backed up existing code to {backup_path}")


def migrate_components_to_feature(feature: str, component_files: List[str]):
    """Migrate components to feature folder"""
    for component_file in component_files:
        source = FRONTEND_PATH / component_file
        if not source.exists():
            print(f"⚠️  Component not found: {component_file}")
            continue

        filename = Path(component_file).name
        dest = SRC_PATH / "features" / feature / "components" / filename
        shutil.copy2(source, dest)
        print(f"✅ Migrated {component_file} -> features/{feature}/components/{filename}")


def migrate_screens_to_feature(feature: str, screen_files: List[str]):
    """Migrate screens to feature folder"""
    for screen_file in screen_files:
        source = FRONTEND_PATH / screen_file
        if not source.exists():
            print(f"⚠️  Screen not found: {screen_file}")
            continue

        filename = Path(screen_file).name
        dest = SRC_PATH / "features" / feature / "screens" / filename
        shutil.copy2(source, dest)
        print(f"✅ Migrated {screen_file} -> features/{feature}/screens/{filename}")


def migrate_ui_components():
    """Migrate UI components to shared/ui"""
    for category, components in SHARED_UI_COMPONENTS.items():
        for component_file in components:
            source = FRONTEND_PATH / component_file
            if not source.exists():
                print(f"⚠️  UI component not found: {component_file}")
                continue

            filename = Path(component_file).name
            dest = SRC_PATH / "shared" / "ui" / category / filename
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, dest)
            print(f"✅ Migrated {component_file} -> shared/ui/{category}/{filename}")


def migrate_contexts_to_features():
    """Migrate context files to appropriate features"""
    if not CONTEXTS_PATH.exists():
        return

    # AuthContext already migrated to features/auth
    auth_context = CONTEXTS_PATH / "AuthContext.tsx"
    if auth_context.exists():
        print(f"✅ AuthContext already in features/auth/store/")


def migrate_utils_to_shared():
    """Migrate utility files to shared"""
    if not UTILS_PATH.exists():
        return

    for util_file in UTILS_PATH.glob("*.ts"):
        dest = SRC_PATH / "shared" / "utils" / util_file.name
        shutil.copy2(util_file, dest)
        print(f"✅ Migrated utils/{util_file.name} -> shared/utils/{util_file.name}")


def create_feature_apis():
    """Create API files for each feature"""
    features_api = {
        "chargers": """/**
 * Chargers API
 *
 * API calls for charger management feature.
 */

import { apiClient, API_ENDPOINTS } from '../../../shared/api';

export const chargersApi = {
  async getNearby(lat: number, lng: number, radius: number = 5000) {
    return apiClient.get(API_ENDPOINTS.CHARGERS.NEARBY, {
      params: { lat, lng, radius }
    });
  },

  async getDetails(id: string) {
    return apiClient.get(API_ENDPOINTS.CHARGERS.DETAILS(id));
  },

  async create(data: any) {
    return apiClient.post(API_ENDPOINTS.CHARGERS.CREATE, data);
  },

  async verify(id: string, data: any) {
    return apiClient.post(API_ENDPOINTS.CHARGERS.VERIFY(id), data);
  },

  async uploadPhoto(id: string, photo: Blob) {
    return apiClient.upload(
      API_ENDPOINTS.CHARGERS.PHOTOS(id),
      photo,
      'photo'
    );
  },
};
""",
        "map": """/**
 * Map API
 *
 * API calls for map feature (uses chargers API).
 */

import { chargersApi } from '../../chargers/api/chargersApi';

export const mapApi = {
  ...chargersApi,
};
""",
        "profile": """/**
 * Profile API
 *
 * API calls for profile management feature.
 */

import { apiClient, API_ENDPOINTS } from '../../../shared/api';

export const profileApi = {
  async getProfile() {
    return apiClient.get(API_ENDPOINTS.PROFILE.GET);
  },

  async updateProfile(data: any) {
    return apiClient.put(API_ENDPOINTS.PROFILE.UPDATE, data);
  },

  async getStats() {
    return apiClient.get(API_ENDPOINTS.PROFILE.STATS);
  },
};
""",
        "routing": """/**
 * Routing API
 *
 * API calls for route planning feature.
 */

import { apiClient, API_ENDPOINTS } from '../../../shared/api';

export const routingApi = {
  async calculateRoute(origin: any, destination: any, options?: any) {
    return apiClient.post(API_ENDPOINTS.ROUTING.CALCULATE, {
      origin,
      destination,
      ...options,
    });
  },

  async getAlternatives(routeId: string) {
    return apiClient.get(API_ENDPOINTS.ROUTING.ALTERNATIVES, {
      params: { route_id: routeId }
    });
  },
};
""",
    }

    for feature, content in features_api.items():
        api_file = SRC_PATH / "features" / feature / "api" / f"{feature}Api.ts"
        api_file.write_text(content)
        print(f"✅ Created API for {feature}")


def create_feature_indexes():
    """Create index.ts files for each feature"""
    index_template = '''/**
 * {feature_title} Feature Module
 *
 * Public API for the {feature} feature.
 */

// Export hooks
// export {{ use{feature_title} }} from './hooks/use{feature_title}';

// Export types
// export type {{ {feature_title}Type }} from './types/{feature}.types';

// Export components (if needed by other features)
// export {{ {feature_title}Component }} from './components/{feature_title}Component';
'''

    features_info = {
        "chargers": "Chargers",
        "map": "Map",
        "profile": "Profile",
        "routing": "Routing",
    }

    for feature, title in features_info.items():
        index_file = SRC_PATH / "features" / feature / "index.ts"
        content = index_template.format(feature=feature, feature_title=title)
        index_file.write_text(content)
        print(f"✅ Created index for {feature}")


def create_shared_ui_index():
    """Create index files for shared UI components"""
    # Create atoms index
    atoms_index = '''/**
 * Atomic UI Components
 *
 * Basic building blocks for the UI.
 */

export { default as AnimatedCheckbox } from './AnimatedCheckbox';
export { default as AnimatedRadio } from './AnimatedRadio';
'''
    (SRC_PATH / "shared" / "ui" / "atoms" / "index.ts").write_text(atoms_index)

    # Create molecules index
    molecules_index = '''/**
 * Molecular UI Components
 *
 * Composite components built from atoms.
 */

export { default as FloatingInput } from './FloatingInput';
export { default as CustomRefreshControl } from './CustomRefreshControl';
'''
    (SRC_PATH / "shared" / "ui" / "molecules" / "index.ts").write_text(molecules_index)

    # Create organisms index
    organisms_index = '''/**
 * Organism UI Components
 *
 * Complex components built from molecules and atoms.
 */

export { default as AnimatedCard } from './AnimatedCard';
export { default as AnimatedListItem } from './AnimatedListItem';
export { default as AnimatedButton } from './AnimatedButton';
export { default as ChartCard } from './ChartCard';
export { default as ElectricButton } from './ElectricButton';
export { default as GlassCard } from './GlassCard';
export { default as ProgressRing } from './ProgressRing';
export { default as PulseIndicator } from './PulseIndicator';
export { default as ShimmerLoader } from './ShimmerLoader';
export { default as StatCard } from './StatCard';
export { default as SuccessAnimation } from './SuccessAnimation';
'''
    (SRC_PATH / "shared" / "ui" / "organisms" / "index.ts").write_text(organisms_index)

    # Create main UI index
    ui_index = '''/**
 * UI Component Library
 *
 * Centralized export of all UI components.
 */

export * from './atoms';
export * from './molecules';
export * from './organisms';
'''
    (SRC_PATH / "shared" / "ui" / "index.ts").write_text(ui_index)

    print("✅ Created shared UI indexes")


def main():
    """Main migration function"""
    print("=" * 60)
    print("SharaSpot Frontend Migration to Feature-Based Architecture")
    print("=" * 60)

    # Step 1: Create feature structure
    print("\n📁 Step 1: Creating feature structure...")
    create_feature_structure()
    create_shared_structure()

    # Step 2: Backup old code
    print("\n💾 Step 2: Backing up existing code...")
    backup_old_code()

    # Step 3: Migrate components to features
    print("\n🔄 Step 3: Migrating components to features...")
    for feature, files in FEATURE_MAPPING.items():
        if files.get("components"):
            migrate_components_to_feature(feature, files["components"])
        if files.get("screens"):
            migrate_screens_to_feature(feature, files["screens"])

    # Step 4: Migrate UI components to shared
    print("\n🎨 Step 4: Migrating UI components to shared...")
    migrate_ui_components()

    # Step 5: Migrate utils
    print("\n🔧 Step 5: Migrating utilities...")
    migrate_utils_to_shared()

    # Step 6: Create feature APIs
    print("\n📡 Step 6: Creating feature APIs...")
    create_feature_apis()

    # Step 7: Create feature indexes
    print("\n📋 Step 7: Creating feature indexes...")
    create_feature_indexes()

    # Step 8: Create shared UI indexes
    print("\n📦 Step 8: Creating shared UI indexes...")
    create_shared_ui_index()

    print("\n" + "=" * 60)
    print("✅ Migration Complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Review migrated code in frontend/src/features/")
    print("2. Update imports in app/ screens to use new features")
    print("3. Update component imports to use shared/ui")
    print("4. Install dependencies: cd frontend && yarn install")
    print("5. Test the app: yarn start")
    print("\nOriginal code backed up to: frontend/backup/")
    print("=" * 60)


if __name__ == "__main__":
    main()
