// app.config.ts
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

// Helper function to load tenant config from individual JSON files
const loadTenant = (tenantId: string): TenantConfig => {
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

  try {
    return JSON.parse(fs.readFileSync(tenantPath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid JSON in tenant config ${tenantPath}: ${(error as Error).message}`);
  }
};

// Helper function to check if tenant exists
const tenantExists = (tenantId: string): boolean => {
  const tenantPath = path.join('./config/tenants', `${tenantId}.json`);
  return fs.existsSync(tenantPath);
};

// Helper function to generate plugins based on tenant features
const generatePlugins = (tenant: TenantConfig): ExpoConfig['plugins'] => {
  const basePlugins: (string | [string] | [string, any])[] = [
    "expo-router",
  ];

  const featurePlugins: Record<string, any[]> = {
    ['premium-features']: [],
  };

  // Add feature-specific plugins
  const enabledPlugins = [...basePlugins];
  
  tenant.features.forEach((feature: string) => {
    if (featurePlugins[feature]) {
      enabledPlugins.push(...featurePlugins[feature]);
    }
  });

  return enabledPlugins;
};

// Get tenant ID from environment variable
const tenantId = process.env.EXPO_PUBLIC_TENANT || 'tenant1';

const generateConfig = (): { expo: ExpoConfig } => {
  try {
    if (!tenantId) {
      throw new Error('Tenant ID is not specified. Set the EXPO_PUBLIC_TENANT environment variable.');
    }

    if (!tenantExists(tenantId)) {
      console.warn(`⚠️ Tenant ${tenantId} not found, using default config`);
      return getDefaultConfig(tenantId);
    }

    const tenant = loadTenant(tenantId);
    console.log(`📱 Loading config for tenant: ${tenantId} (${tenant.name})`);

    return {
      expo: {
        name: tenant.name,
        slug: tenant.slug,
        version: process.env.APP_VERSION || "1.0.0",
        orientation: "portrait",
        icon: tenant.assets.icon, //You should use CDN instead of local assets in production
        userInterfaceStyle: "light",
        splash: {
          image: tenant.assets.splash,
          resizeMode: "contain",
          backgroundColor: tenant.theme.backgroundColor,
        },
        assetBundlePatterns: ["**/*"],
        ios: {
          supportsTablet: true,
          bundleIdentifier: tenant.bundleIdentifier,
          infoPlist: {
            CFBundleDisplayName: tenant.branding.appName,
          },
        },
        android: {
          adaptiveIcon: {
            foregroundImage: tenant.assets.icon,
            backgroundColor: tenant.theme.backgroundColor,
          },
          package: tenant.package,
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
        plugins: generatePlugins(tenant),
        experiments: {
          typedRoutes: true,
        },
        extra: {
          tenantId: tenantId,
          tenantConfig: tenant,
          eas: {
            projectId: process.env.EXPO_PROJECT_ID,
          },
        },
      },
    };
  } catch (error) {
    console.error('❌ Error loading tenant config:', (error as Error).message);
    console.log('🔄 Falling back to default config');
    return getDefaultConfig(tenantId);
  }
};

// Default configuration fallback
const getDefaultConfig = (tenantId: string): { expo: ExpoConfig } => {
  console.log(`🔄 Using default configuration for tenant: ${tenantId}`);
  
  return {
    expo: {
      name: `Default App (${tenantId})`,
      slug: "default-app",
      version: process.env.APP_VERSION || "1.0.0",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "light",
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      },
      assetBundlePatterns: ["**/*"],
      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.yourcompany.defaultapp"
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#FFFFFF"
        },
        package: "com.yourcompany.defaultapp"
      },
      web: {
        bundler: "metro",
        output: "static",
        favicon: "./assets/favicon.png"
      },
      plugins: [
        "expo-router",
        "expo-notifications",
      ],
      experiments: {
        typedRoutes: true
      },
      extra: {
        tenantId: tenantId,
        eas: {
          projectId: process.env.EXPO_PROJECT_ID
        }
      }
    }
  };
};

export default generateConfig();