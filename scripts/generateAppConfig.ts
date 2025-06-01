// scripts/generateAppConfig.ts
import { ExpoConfig } from 'expo/config';
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

export const generateAppConfig = (tenantId: string): { expo: ExpoConfig } => {
  const tenantsDir = './config/tenants';
  const tenantPath = path.join(tenantsDir, `${tenantId}.json`);
  
  if (!fs.existsSync(tenantsDir)) {
    throw new Error('config/tenants directory not found. Create tenants first with npm run tenant:add');
  }
  
  if (!fs.existsSync(tenantPath)) {
    const availableTenants = fs.readdirSync(tenantsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
    
    throw new Error(
      `Tenant ${tenantId} not found. Available tenants: ${availableTenants.join(', ')}`
    );
  }

  let tenant: TenantConfig;
  try {
    tenant = JSON.parse(fs.readFileSync(tenantPath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid JSON in tenant config ${tenantPath}: ${(error as Error).message}`);
  }

  console.log(`📱 Generating app config for: ${tenantId} (${tenant.name})`);

  const appConfig: { expo: ExpoConfig } = {
    expo: {
      name: tenant.name,
      slug: tenant.slug,
      version: process.env.APP_VERSION || "1.0.0",
      orientation: "portrait",
      icon: tenant.assets.icon,
      userInterfaceStyle: "light",
      splash: {
        image: tenant.assets.splash,
        backgroundColor: tenant.theme.backgroundColor,
        resizeMode: "contain",
      },
      assetBundlePatterns: ["**/*"],
      ios: {
        bundleIdentifier: tenant.bundleIdentifier,
        supportsTablet: true,
        infoPlist: {
          CFBundleDisplayName: tenant.branding.appName,
        },
      },
      android: {
        package: tenant.package,
        adaptiveIcon: {
          foregroundImage: tenant.assets.icon,
          backgroundColor: tenant.theme.backgroundColor,
        },
        permissions: [
          "android.permission.INTERNET",
          "android.permission.SYSTEM_ALERT_WINDOW",
        ],
      },
      web: {
        bundler: "metro",
        output: "static",
        favicon: tenant.assets.icon,
      },
      scheme: tenant.slug,
      extra: {
        tenantId: tenantId,
        tenantConfig: tenant,
        eas: {
          projectId: process.env.EXPO_PROJECT_ID,
        },
      },
      plugins: generatePlugins(tenant),
      experiments: {
        typedRoutes: true,
      },
    },
  };

  return appConfig;
};

// Helper function to generate plugins based on tenant features
const generatePlugins = (tenant: TenantConfig): ExpoConfig['plugins'] => {
  const basePlugins: ExpoConfig['plugins'] = [
    "expo-router",
    "expo-notifications",
    [
      "expo-build-properties",
      {
        ios: {
          newArchEnabled: true,
        },
        android: {
          newArchEnabled: true,
        },
      }
    ],
  ];

  const featurePlugins: Record<string, ExpoConfig['plugins']> = {
    premium: [
      "expo-in-app-purchases",
      [
        "expo-camera",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
          microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone to record audio.",
          recordAudioAndroid: true,
        }
      ],
    ],
    analytics: [
      [
        "expo-tracking-transparency",
        {
          userTrackingUsageDescription: "This identifier will be used to deliver personalized ads to you."
        }
      ],
    ],
    location: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow $(PRODUCT_NAME) to use your location.",
          locationAlwaysPermission: "Allow $(PRODUCT_NAME) to use your location.",
          locationWhenInUsePermission: "Allow $(PRODUCT_NAME) to use your location.",
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true,
        }
      ],
    ],
    storage: [
      [
        "expo-document-picker",
        {
          iCloudContainerEnvironment: "Production"
        }
      ],
    ],
  };

  // Add feature-specific plugins
  const enabledPlugins: ExpoConfig['plugins'] = [...basePlugins];
  
  tenant.features.forEach(feature => {
    if (featurePlugins[feature]) {
      enabledPlugins.push(...featurePlugins[feature]);
    }
  });

  return enabledPlugins;
};

// Helper function to validate tenant config
export const validateTenantConfig = (tenant: TenantConfig, tenantId: string): string[] => {
  const errors: string[] = [];
  
  const requiredFields = [
    'name', 'slug', 'bundleIdentifier', 'package'
  ] as const;
  
  requiredFields.forEach(field => {
    if (!tenant[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  if (!tenant.theme?.primaryColor) {
    errors.push('Missing theme.primaryColor');
  }
  if (!tenant.theme?.backgroundColor) {
    errors.push('Missing theme.backgroundColor');
  }
  if (!tenant.api?.baseUrl) {
    errors.push('Missing api.baseUrl');
  }
  if (!tenant.assets?.icon) {
    errors.push('Missing assets.icon');
  }
  if (!tenant.assets?.splash) {
    errors.push('Missing assets.splash');
  }

  if (tenant.assets) {
    ['icon', 'splash', 'logo'].forEach(assetType => {
      const assetPath = tenant.assets[assetType as keyof typeof tenant.assets];
      if (assetPath && !fs.existsSync(assetPath)) {
        errors.push(`Asset file not found: ${assetPath}`);
      }
    });
  }

  if (tenant.bundleIdentifier && !/^[a-zA-Z0-9.-]+$/.test(tenant.bundleIdentifier)) {
    errors.push('Invalid bundle identifier format');
  }

  if (tenant.package && !/^[a-zA-Z0-9._]+$/.test(tenant.package)) {
    errors.push('Invalid package name format');
  }

  if (tenant.slug && !/^[a-zA-Z0-9-]+$/.test(tenant.slug)) {
    errors.push('Invalid slug format (use only letters, numbers, and hyphens)');
  }

  const colorFields = [
    { name: 'primaryColor', value: tenant.theme?.primaryColor },
    { name: 'backgroundColor', value: tenant.theme?.backgroundColor },
    { name: 'secondaryColor', value: tenant.theme?.secondaryColor },
    { name: 'textColor', value: tenant.theme?.textColor },
  ];

  colorFields.forEach(({ name, value }) => {
    if (value && !/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(value)) {
      errors.push(`Invalid color format for ${name}: ${value}`);
    }
  });

  if (tenant.api?.baseUrl) {
    try {
      new URL(tenant.api.baseUrl);
    } catch {
      errors.push(`Invalid API URL: ${tenant.api.baseUrl}`);
    }
  }

  return errors;
};

// If run directly, generate app config for specified tenant
if (require.main === module) {
  const tenantId = process.argv[2] || process.env.TENANT;
  
  if (!tenantId) {
    console.error('❌ Usage: tsx scripts/generateAppConfig.ts <tenantId>');
    console.error('   or set TENANT environment variable');
    process.exit(1);
  }

  try {
    const config = generateAppConfig(tenantId);
    
    // Validate the config
    const tenant = JSON.parse(fs.readFileSync(`./config/tenants/${tenantId}.json`, 'utf8'));
    const errors = validateTenantConfig(tenant, tenantId);
    
    if (errors.length > 0) {
      console.error(`❌ Validation errors for tenant ${tenantId}:`);
      errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }

    // Save generated config
    const outputPath = './app.config.generated.js';
    const configContent = `// Auto-generated app.config.js for tenant: ${tenantId}
// Generated at: ${new Date().toISOString()}

module.exports = ${JSON.stringify(config, null, 2)};
`;
    
    fs.writeFileSync(outputPath, configContent);
    console.log(`✅ Generated app config for ${tenantId}`);
    console.log(`📄 Saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Failed to generate app config:', (error as Error).message);
    process.exit(1);
  }
}