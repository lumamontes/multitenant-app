// scripts/listTenants.ts
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

function listTenants(): void {
  try {
    const tenantsDir = './config/tenants';
    
    if (!fs.existsSync(tenantsDir)) {
      console.log('❌ config/tenants directory not found. Create it first with npm run tenant:add');
      process.exit(1);
    }

    // Get all tenant JSON files
    const tenantFiles = fs.readdirSync(tenantsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
    
    if (tenantFiles.length === 0) {
      console.log('📱 No tenants configured yet. Add one with: npm run tenant:add');
      return;
    }

    console.log(`\n📱 Available tenants (${tenantFiles.length}):\n`);
    
    tenantFiles.forEach((tenantId, index) => {
      try {
        const tenantPath = path.join(tenantsDir, `${tenantId}.json`);
        const tenant: TenantConfig = JSON.parse(fs.readFileSync(tenantPath, 'utf8'));
        
        console.log(`${index + 1}. ${tenantId}`);
        console.log(`   Name: ${tenant.name}`);
        console.log(`   Bundle ID: ${tenant.bundleIdentifier}`);
        console.log(`   API: ${tenant.api.baseUrl}`);
        console.log(`   Features: ${tenant.features.join(', ')}`);
        console.log(`   Color: ${tenant.theme.primaryColor}`);
        console.log(`   Company: ${tenant.branding?.companyName || 'N/A'}`);
        console.log(`   Config: ./config/tenants/${tenantId}.json`);
        console.log('');
      } catch (error) {
        console.log(`${index + 1}. ${tenantId}`);
        console.log(`   ❌ Error reading config: ${(error as Error).message}`);
        console.log('');
      }
    });

    console.log('💡 Usage:');
    console.log(`   View details: npm run tenant:info <tenantId>`);
    console.log(`   Start dev: TENANT=<tenantId> npm run start`);
    console.log(`   Build: eas build --profile <tenantId>-production`);
    console.log(`   Edit config: ./config/tenants/<tenantId>.json`);
    
  } catch (error) {
    console.error('❌ Error reading tenants:', (error as Error).message);
    process.exit(1);
  }
}

listTenants();