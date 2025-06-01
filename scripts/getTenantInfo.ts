// scripts/getTenantInfo.ts
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

function getTenantInfo(): void {
  const tenantId = process.argv[2];
  
  if (!tenantId) {
    console.log('❌ Usage: npm run tenant:info <tenantId>');
    console.log('\n💡 Available commands:');
    console.log('   npm run tenant:list    - Show all tenants');
    console.log('   npm run tenant:add     - Add new tenant');
    process.exit(1);
  }

  try {
    const tenantsDir = './config/tenants';
    const tenantPath = path.join(tenantsDir, `${tenantId}.json`);
    
    if (!fs.existsSync(tenantsDir)) {
      console.log('❌ config/tenants directory not found. Create it first with npm run tenant:add');
      process.exit(1);
    }

    if (!fs.existsSync(tenantPath)) {
      console.error(`❌ Tenant '${tenantId}' not found!`);
      console.log('\n📱 Available tenants:');
      
      const availableTenants = fs.readdirSync(tenantsDir)
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
        
      availableTenants.forEach(id => {
        console.log(`   - ${id}`);
      });
      process.exit(1);
    }

    const tenant: TenantConfig = JSON.parse(fs.readFileSync(tenantPath, 'utf8'));

    console.log(`\n📱 Tenant Details: ${tenantId}\n`);
    console.log(`🏷️  Name: ${tenant.name}`);
    console.log(`🔗 Slug: ${tenant.slug}`);
    console.log(`📦 Bundle ID: ${tenant.bundleIdentifier}`);
    console.log(`🤖 Android Package: ${tenant.package}`);
    console.log(`🌐 API URL: ${tenant.api.baseUrl}`);
    console.log(`🎨 Primary Color: ${tenant.theme.primaryColor}`);
    console.log(`🎨 Background Color: ${tenant.theme.backgroundColor}`);
    console.log(`🎨 Secondary Color: ${tenant.theme.secondaryColor}`);
    console.log(`🎨 Text Color: ${tenant.theme.textColor}`);
    console.log(`✨ Features: ${tenant.features.join(', ')}`);
    console.log(`🖼️  Icon: ${tenant.assets.icon}`);
    console.log(`🖼️  Splash: ${tenant.assets.splash}`);
    console.log(`🖼️  Logo: ${tenant.assets.logo}`);
    
    if (tenant.branding) {
      console.log(`\n🏢 Branding:`);
      console.log(`   App Name: ${tenant.branding.appName}`);
      console.log(`   Company: ${tenant.branding.companyName}`);
      console.log(`   Support: ${tenant.branding.supportEmail}`);
      console.log(`   Website: ${tenant.branding.website}`);
    }

    // Check if assets exist
    console.log('\n📁 Asset Status:');
    const iconExists = fs.existsSync(tenant.assets.icon);
    const splashExists = fs.existsSync(tenant.assets.splash);
    const logoExists = fs.existsSync(tenant.assets.logo);
    
    console.log(`   Icon: ${iconExists ? '✅ Found' : '❌ Missing'} (${tenant.assets.icon})`);
    console.log(`   Splash: ${splashExists ? '✅ Found' : '❌ Missing'} (${tenant.assets.splash})`);
    console.log(`   Logo: ${logoExists ? '✅ Found' : '❌ Missing'} (${tenant.assets.logo})`);

    if (!iconExists || !splashExists || !logoExists) {
      console.log('\n💡 Missing assets? Create them:');
      if (!iconExists) console.log(`   - Add icon: ${tenant.assets.icon} (1024x1024px)`);
      if (!splashExists) console.log(`   - Add splash: ${tenant.assets.splash}`);
      if (!logoExists) console.log(`   - Add logo: ${tenant.assets.logo}`);
    }

    console.log(`\n📄 Config file: ${tenantPath}`);

    console.log('\n🚀 Quick Commands:');
    console.log(`   Development: TENANT=${tenantId} npm run start`);
    console.log(`   Build iOS: eas build --profile ${tenantId}-production --platform ios`);
    console.log(`   Build Android: eas build --profile ${tenantId}-production --platform android`);
    console.log(`   Preview Build: eas build --profile ${tenantId}-preview --platform all`);
    console.log(`   Edit Config: code ${tenantPath}`);
    
  } catch (error) {
    console.error('❌ Error reading tenant info:', (error as Error).message);
    process.exit(1);
  }
}

getTenantInfo();