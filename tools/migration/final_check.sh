#!/bin/bash

echo "=========================================="
echo "FINAL COMPREHENSIVE CHECK"
echo "=========================================="
echo ""

# Check backend structure
echo "📁 Backend Structure Check:"
for module in auth chargers routing gamification profile analytics; do
    if [ -d "backend/modules/$module" ]; then
        echo "  ✅ $module module exists"
        
        # Check layers
        for layer in domain application infrastructure presentation; do
            if [ -d "backend/modules/$module/$layer" ]; then
                files=$(find "backend/modules/$module/$layer" -name "*.py" ! -name "__init__.py" | wc -l)
                if [ $files -gt 0 ]; then
                    echo "    ✅ $layer/ ($files files)"
                fi
            fi
        done
    else
        echo "  ❌ $module module MISSING"
    fi
done
echo ""

# Check shared kernel
echo "📁 Shared Kernel Check:"
if [ -d "backend/shared" ]; then
    domain_files=$(find backend/shared/domain -name "*.py" ! -name "__init__.py" | wc -l)
    app_files=$(find backend/shared/application -name "*.py" ! -name "__init__.py" | wc -l)
    infra_files=$(find backend/shared/infrastructure -name "*.py" ! -name "__init__.py" | wc -l)
    echo "  ✅ domain/ ($domain_files files)"
    echo "  ✅ application/ ($app_files files)"
    echo "  ✅ infrastructure/ ($infra_files files)"
else
    echo "  ❌ shared/ MISSING"
fi
echo ""

# Check frontend structure
echo "📁 Frontend Structure Check:"
for feature in auth chargers map profile routing; do
    if [ -d "frontend/src/features/$feature" ]; then
        files=$(find "frontend/src/features/$feature" -name "*.ts" -o -name "*.tsx" | wc -l)
        echo "  ✅ $feature feature ($files files)"
    else
        echo "  ❌ $feature feature MISSING"
    fi
done
echo ""

# Check shared frontend
echo "📁 Frontend Shared Check:"
if [ -d "frontend/src/shared" ]; then
    api_files=$(find frontend/src/shared/api -name "*.ts" 2>/dev/null | wc -l)
    ui_files=$(find frontend/src/shared/ui -name "*.ts*" 2>/dev/null | wc -l)
    echo "  ✅ shared/api/ ($api_files files)"
    echo "  ✅ shared/ui/ ($ui_files files)"
else
    echo "  ❌ shared/ MISSING"
fi
echo ""

# Check critical files
echo "📄 Critical Files Check:"
critical_files=(
    "backend/main.py"
    "backend/container.py"
    "backend/shared/domain/entity.py"
    "backend/shared/domain/events.py"
    "frontend/src/shared/api/client.ts"
    "frontend/src/shared/api/config.ts"
    "frontend/src/features/auth/index.ts"
    "frontend/package.json"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file MISSING"
    fi
done
echo ""

# Count total files
echo "📊 File Counts:"
backend_py=$(find backend/modules -name "*.py" | wc -l)
backend_shared=$(find backend/shared -name "*.py" | wc -l)
frontend_features=$(find frontend/src/features -name "*.ts*" 2>/dev/null | wc -l)
frontend_shared=$(find frontend/src/shared -name "*.ts*" 2>/dev/null | wc -l)

echo "  Backend modules: $backend_py Python files"
echo "  Backend shared: $backend_shared Python files"
echo "  Frontend features: $frontend_features TypeScript files"
echo "  Frontend shared: $frontend_shared TypeScript files"
echo ""

echo "=========================================="
echo "✅ FINAL CHECK COMPLETE"
echo "=========================================="
