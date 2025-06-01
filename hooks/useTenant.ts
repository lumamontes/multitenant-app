import Constants from 'expo-constants';

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

export const useTenant = (): TenantConfig | null => {
  const tenantConfig = Constants.expoConfig?.extra?.tenantConfig;

  if (!tenantConfig) {
    console.warn('No tenant configuration found in expo config.');
    return null;
  }
  return {
    icon: Constants.expoConfig?.icon,
    // Get other assets from tenant config
    splash: tenantConfig?.assets?.splash,
    logo: tenantConfig?.assets?.logo,
    ...tenantConfig,
    // Ensure all required fields are present
  };
};