// scripts/generateEasConfig.ts
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

export const generateEasConfig = () => {
  const tenantsDir = './config/tenants';
  
  if (!fs.existsSync(tenantsDir)) {
    throw new Error('config/tenants directory not found. Create tenants first with npm run tenant:add');
  }

  // Get all tenant JSON files
  const tenantFiles = fs.readdirSync(tenantsDir)
    .filter(file => file.endsWith('.json'));

  if (tenantFiles.length === 0) {
    throw new Error('No tenant configurations found. Add tenants with npm run tenant:add');
  }

  const easConfig: any = {
    cli: {
      version: ">= 3.0.0"
    },
    build: {},
    submit: {}
  };

  console.log(`📦 Generating EAS config for ${tenantFiles.length} tenants...`);

  tenantFiles.forEach(file => {
    const tenantId = file.replace('.json', '');
    const tenantPath = path.join(tenantsDir, file);
    
    try {
      const tenant: TenantConfig = JSON.parse(fs.readFileSync(tenantPath, 'utf8'));
      
      console.log(`   ✅ Adding ${tenantId} (${tenant.name})`);
      
      // Build profiles
      easConfig.build[`${tenantId}-production`] = {
        env: {
          TENANT: tenantId,
          APP_VERSION: process.env.APP_VERSION || "1.0.0"
        },
        ios: {
          bundleIdentifier: tenant.bundleIdentifier,
          buildConfiguration: "Release"
        },
        android: {
          package: tenant.package,
          buildType: "apk"
        }
      };

      easConfig.build[`${tenantId}-preview`] = {
        extends: `${tenantId}-production`,
        distribution: "internal",
        ios: {
          bundleIdentifier: tenant.bundleIdentifier,
          buildConfiguration: "Debug"
        },
        android: {
          package: tenant.package,
          buildType: "apk",
          gradleCommand: ":app:assembleDebug"
        }
      };

      easConfig.build[`${tenantId}-development`] = {
        extends: `${tenantId}-production`,
        developmentClient: true,
        distribution: "internal",
        ios: {
          bundleIdentifier: `${tenant.bundleIdentifier}.dev`,
          buildConfiguration: "Debug"
        },
        android: {
          package: `${tenant.package}.dev`,
          buildType: "apk",
          gradleCommand: ":app:assembleDebug"
        }
      };

      // Submit profiles
      easConfig.submit[`${tenantId}-production`] = {
        ios: {
          bundleIdentifier: tenant.bundleIdentifier,
          ascAppId: process.env[`${tenantId.toUpperCase()}_ASC_APP_ID`] // Optional: per-tenant App Store Connect ID
        },
        android: {
          package: tenant.package,
          track: "production"
        }
      };

      easConfig.submit[`${tenantId}-internal`] = {
        ios: {
          bundleIdentifier: tenant.bundleIdentifier,
          ascAppId: process.env[`${tenantId.toUpperCase()}_ASC_APP_ID`]
        },
        android: {
          package: tenant.package,
          track: "internal"
        }
      };

    } catch (error) {
      console.error(`   ❌ Error processing ${tenantId}: ${(error as Error).message}`);
      throw error;
    }
  });

  return easConfig;
};

if (require.main === module) {
  try {
    const easConfig = generateEasConfig();
    const easConfigPath = './eas.json';
    
    fs.writeFileSync(easConfigPath, JSON.stringify(easConfig, null, 2));
    console.log(`\n📄 EAS configuration saved to: ${easConfigPath}`);
    console.log(`\n🚀 Available build profiles:`);
    
    Object.keys(easConfig.build).forEach(profile => {
      console.log(`   - ${profile}`);
    });
    
    console.log(`\n📱 Available submit profiles:`);
    Object.keys(easConfig.submit).forEach(profile => {
      console.log(`   - ${profile}`);
    });
    
    console.log(`\n💡 Usage examples:`);
    console.log(`   eas build --profile tenant1-production --platform ios`);
    console.log(`   eas build --profile tenantTwo-preview --platform all`);
    console.log(`   eas submit --profile tenant1-production --platform ios`);
    
  } catch (error) {
    console.error('❌ Failed to generate EAS config:', (error as Error).message);
    process.exit(1);
  }
}