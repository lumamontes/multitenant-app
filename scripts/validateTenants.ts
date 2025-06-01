// scripts/validateTenants.ts
import * as fs from 'fs';
import * as path from 'path';

interface TenantConfig {
  name: string;
  slug: string;
  bundleIdentifier: string;
  package: string;
  theme: {
    primaryColor: string;
    backgroundColor: string;
    secondaryColor: string;
    textColor: string;
  };
  api: {
    baseUrl: string;
  };
  features: string[];
  assets: {
    icon: string;
    splash: string;
    logo: string;
  };
  branding: {
    appName: string;
    companyName: string;
    supportEmail: string;
    website: string;
  };
}

function validateTenants(): void {
  try {
    const tenantsDir = './config/tenants';
    
    if (!fs.existsSync(tenantsDir)) {
      console.log('❌ config/tenants directory not found');
      process.exit(1);
    }

    const tenantFiles = fs.readdirSync(tenantsDir)
      .filter(file => file.endsWith('.json'));
      
    let hasErrors = false;

    console.log(`🔍 Validating ${tenantFiles.length} tenants...\n`);

    // Check for duplicate bundle IDs and packages
    const bundleIds = new Set<string>();
    const packages = new Set<string>();
    const slugs = new Set<string>();

    tenantFiles.forEach(file => {
      const tenantId = file.replace('.json', '');
      const tenantPath = path.join(tenantsDir, file);
      
      console.log(`📱 Validating ${tenantId}...`);

      try {
        const tenant: TenantConfig = JSON.parse(fs.readFileSync(tenantPath, 'utf8'));

        // Check required fields
        const requiredFields = ['name', 'slug', 'bundleIdentifier', 'package'] as const;
        requiredFields.forEach(field => {
          if (!tenant[field]) {
            console.log(`   ❌ Missing ${field}`);
            hasErrors = true;
          }
        });

        // Check nested required fields
        if (!tenant.theme?.primaryColor) {
          console.log(`   ❌ Missing theme.primaryColor`);
          hasErrors = true;
        }
        if (!tenant.api?.baseUrl) {
          console.log(`   ❌ Missing api.baseUrl`);
          hasErrors = true;
        }

        // Check for duplicates
        if (bundleIds.has(tenant.bundleIdentifier)) {
          console.log(`   ❌ Duplicate bundle identifier: ${tenant.bundleIdentifier}`);
          hasErrors = true;
        } else {
          bundleIds.add(tenant.bundleIdentifier);
        }

        if (packages.has(tenant.package)) {
          console.log(`   ❌ Duplicate package: ${tenant.package}`);
          hasErrors = true;
        } else {
          packages.add(tenant.package);
        }

        if (slugs.has(tenant.slug)) {
          console.log(`   ❌ Duplicate slug: ${tenant.slug}`);
          hasErrors = true;
        } else {
          slugs.add(tenant.slug);
        }

        // Check assets
        if (tenant.assets) {
          if (!fs.existsSync(tenant.assets.icon)) {
            console.log(`   ⚠️  Missing icon: ${tenant.assets.icon}`);
          }
          if (!fs.existsSync(tenant.assets.splash)) {
            console.log(`   ⚠️  Missing splash: ${tenant.assets.splash}`);
          }
          if (!fs.existsSync(tenant.assets.logo)) {
            console.log(`   ⚠️  Missing logo: ${tenant.assets.logo}`);
          }
        }

        // Validate URL
        if (tenant.api?.baseUrl) {
          try {
            new URL(tenant.api.baseUrl);
          } catch {
            console.log(`   ❌ Invalid API URL: ${tenant.api.baseUrl}`);
            hasErrors = true;
          }
        }

        // Validate color formats
        const colorFields = [
          { field: 'primaryColor', value: tenant.theme?.primaryColor },
          { field: 'backgroundColor', value: tenant.theme?.backgroundColor },
          { field: 'secondaryColor', value: tenant.theme?.secondaryColor },
          { field: 'textColor', value: tenant.theme?.textColor }
        ];

        colorFields.forEach(({ field, value }) => {
          if (value && !/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(value)) {
            console.log(`   ❌ Invalid ${field} format: ${value}`);
            hasErrors = true;
          }
        });

        if (!hasErrors) {
          console.log(`   ✅ Valid`);
        }

      } catch (error) {
        console.log(`   ❌ Invalid JSON: ${(error as Error).message}`);
        hasErrors = true;
      }

      console.log('');
    });

    if (hasErrors) {
      console.log('❌ Validation failed! Please fix the errors above.');
      process.exit(1);
    } else {
      console.log('✅ All tenants are valid!');
    }
    
  } catch (error) {
    console.error('❌ Error validating tenants:', (error as Error).message);
    process.exit(1);
  }
}

validateTenants();