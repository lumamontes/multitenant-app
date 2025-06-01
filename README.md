# Multitenant Expo App

A scalable React Native Expo application that supports multiple tenants with individual configurations, branding, and app store deployments.

## 🏗️ Architecture Overview

This project allows you to:
- ✅ Build multiple apps from a single codebase
- ✅ Each tenant has separate app store listings
- ✅ Individual branding, themes, and configurations
- ✅ Feature flags per tenant
- ✅ Automated builds and deployments via GitHub Actions

## 📁 Project Structure

```
multitenant/
├── config/
│   ├── tenants/           # Individual tenant JSON configs
│   │   ├── tenant1.json
│   │   ├── tenantTwo.json
│   │   └── tenant3.json
│   └── index.ts           # Config helper functions
├── scripts/               # Management scripts
│   ├── addTenant.ts       # Add new tenant
│   ├── listTenants.ts     # List all tenants
│   ├── validateTenants.ts # Validate configs
│   ├── buildAll.ts        # Build all tenants
│   └── generateConfigs.ts # Generate EAS/app configs
├── assets/               # Tenant-specific assets
│   ├── tenant1/
│   │   ├── icon.png
│   │   ├── splash.png
│   │   └── logo.png
│   └── tenantTwo/
│       ├── icon.png
│       ├── splash.png
│       └── logo.png
├── src/
│   ├── context/
│   │   └── tenantContext.tsx  # Tenant context provider
│   └── hooks/
│       └── useTenantAssets.ts # Dynamic asset loading
├── app.config.ts         # Dynamic Expo configuration
├── eas.json             # Auto-generated EAS build config
└── TENANTS.md           # Auto-generated tenant docs
```

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd multitenant

# Install dependencies
npm install

# Install development tools
npm install --save-dev tsx @types/node typescript
```

### 2. Add Your First Tenant

```bash
# Interactive tenant creation
npm run tenant:add

# Follow the prompts:
# - Tenant ID: mycompany
# - App Name: MyCompany App
# - Bundle Identifier: com.yourcompany.mycompany
# - Primary Color: #FF0000
# - API URL: https://api.mycompany.com
# - Company Name: MyCompany Inc.
```

### 3. Add Tenant Assets

```bash
# Create assets for your tenant
mkdir -p assets/mycompany
# Add these files (1024x1024 for icon):
# - assets/mycompany/icon.png
# - assets/mycompany/splash.png  
# - assets/mycompany/logo.png
```

### 4. Development

```bash
# Start development server for specific tenant
EXPO_PUBLIC_TENANT=mycompany npm run start

# Or use predefined scripts
npm run start:tenant1
npm run start:tenantTwo
```

## 📱 Tenant Management

### List All Tenants

```bash
npm run tenant:list
```

### View Tenant Details

```bash
npm run tenant:info mycompany
```

### Validate Tenant Configurations

```bash
npm run tenant:validate
```

## 🔧 Configuration

### Tenant Configuration Format

Each tenant has a JSON configuration file in `config/tenants/`:

```json
{
  "name": "MyCompany App",
  "slug": "mycompany-app",
  "bundleIdentifier": "com.yourcompany.mycompany",
  "package": "com.yourcompany.mycompany",
  "theme": {
    "primaryColor": "#FF0000",
    "backgroundColor": "#FFFFFF",
    "secondaryColor": "#FF000066",
    "textColor": "#000000"
  },
  "api": {
    "baseUrl": "https://api.mycompany.com"
  },
  "features": ["basic", "premium"],
  "assets": {
    "icon": "./assets/mycompany/icon.png",
    "splash": "./assets/mycompany/splash.png",
    "logo": "./assets/mycompany/logo.png"
  },
  "branding": {
    "appName": "MyCompany",
    "companyName": "MyCompany Inc.",
    "supportEmail": "support@mycompany.com",
    "website": "https://mycompany.com"
  }
}
```

### Feature Flags

Available features that affect app functionality and plugins:

- `basic` - Basic functionality
- `premium` - In-app purchases, camera access
- `analytics` - Tracking and analytics
- `location` - Location services
- `storage` - Document picker and file access

### Environment Variables

```bash
# Required for development
EXPO_PUBLIC_TENANT=tenant_id    # Which tenant to build/run
EXPO_PROJECT_ID=your_project_id # Expo project ID

# Optional
APP_VERSION=1.0.0              # Override app version
```

## 🏗️ Building Apps

### Generate Configurations

```bash
# Generate EAS build configuration for all tenants
npm run config:generate

# Generate for specific tenant
EXPO_PUBLIC_TENANT=mycompany npm run config:generate
```

### Build Single Tenant

```bash
# Build production iOS app
eas build --profile mycompany-production --platform ios

# Build preview for testing
eas build --profile mycompany-preview --platform all

# Build development version
eas build --profile mycompany-development --platform all
```

### Build All Tenants

```bash
# Build all tenants for all platforms (production)
npm run build:all

# Build for specific platform
npm run build:all ios production
npm run build:all android preview

# Dry run (test without building)
npm run build:all all production --dry-run

# Skip validation
npm run build:all all production --skip-validation
```

## 🚀 Deployment

### App Store Submission

```bash
# Submit specific tenant to app stores
eas submit --profile mycompany-production --platform all

# Submit all tenants (use with caution)
# This should typically be done via GitHub Actions
```

### GitHub Actions

The project includes automated workflows:

- **Build on PR**: Creates preview builds
- **Build on Push**: Builds all tenants for main branch
- **Release on Tag**: Builds and deploys all tenants

```bash
# Trigger release build
git tag v1.0.0
git push origin v1.0.0
```

## 💻 Development

### Using Tenant Context

```typescript
import { useTenantContext } from '@/context/tenantContext';

export default function MyComponent() {
  const { tenant, loading } = useTenantContext();
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <View style={{ backgroundColor: tenant.theme.primaryColor }}>
      <Text>{tenant.branding.appName}</Text>
    </View>
  );
}
```
## 🔍 Troubleshooting

### Common Issues

**Tenant not found error:**
```bash
# Check available tenants
npm run tenant:list

# Verify tenant config exists
ls config/tenants/
```

**Build profile not found:**
```bash
# Regenerate EAS configuration
npm run config:generate

# Check generated profiles
cat eas.json | grep -A 2 "build"
```

**Asset not found:**
```bash
# Verify assets exist
ls assets/mycompany/

# Check tenant config paths
npm run tenant:info mycompany
```

### Validation Errors

```bash
# Run validation to see specific issues
npm run tenant:validate

# Common fixes:
# - Ensure all required fields are present
# - Check asset file paths
# - Validate color hex formats
# - Verify bundle ID uniqueness
```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run tenant:add` | Add new tenant (interactive) |
| `npm run tenant:list` | List all tenants |
| `npm run tenant:info <id>` | Show tenant details |
| `npm run tenant:validate` | Validate all tenant configs |
| `npm run config:generate` | Generate EAS configuration |
| `npm run build:all` | Build all tenants |
| `npm run build:all:dry` | Dry run build process |
| `EXPO_PUBLIC_TENANT=<id> npm run start` | Start dev server |

## 🤝 Contributing

1. Add new tenant: `npm run tenant:add`
2. Add assets in `assets/<tenant_id>/`
3. Test locally: `EXPO_PUBLIC_TENANT=<tenant_id> npm run start`
4. Validate: `npm run tenant:validate`
5. Build test: `npm run build:all all preview --dry-run`

## 🆘 Support

- Check existing tenant configs: `npm run tenant:list`
- Validate configurations: `npm run tenant:validate`
- View detailed tenant info: `npm run tenant:info <tenant_id>`
- Generate fresh configs: `npm run config:generate`

---

**Generated automatically** - Run `npm run config:generate` to update tenant documentation.