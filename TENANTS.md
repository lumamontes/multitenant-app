# Tenant Configuration Overview

Generated: 2025-06-01T08:19:05.518Z
Total Tenants: 2

## Available Tenants

| Tenant ID | App Name | Bundle ID | Features | Primary Color |
|-----------|----------|-----------|----------|---------------|
| tenant1 | Tenant One App | com.yourcompany.tenantone | basic | #FF0000 |
| tenant2 | Tenant Two App | com.yourcompany.tenantTwo | basic | #FF0000 |

## Quick Commands

### Development
```bash
# Start development server for specific tenant
TENANT=<tenantId> expo start

# Examples:
TENANT=tenant1 expo start
TENANT=tenant2 expo start
```

### Building
```bash
# Build specific tenant
eas build --profile <tenantId>-production --platform <ios|android>

# Build all tenants
npm run build:all

# Examples:
eas build --profile tenant1-production --platform ios
eas build --profile tenant2-production --platform ios
```

### Management
```bash
# List all tenants
npm run tenant:list

# Get tenant details
npm run tenant:info <tenantId>

# Validate all tenant configs
npm run tenant:validate

# Add new tenant
npm run tenant:add
```

## Configuration Files

- **tenant1**: `./config/tenants/tenant1.json`
- **tenant2**: `./config/tenants/tenant2.json`

---
*This documentation is auto-generated. Run `npm run config:generate` to update.*
