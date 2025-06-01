// scripts/addTenant.ts
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt: string): Promise<string> => 
  new Promise(resolve => rl.question(prompt, resolve));

const createTenant = async () => {
  try {
    console.log('Adding new tenant...\n');
    
    const id = await question('Tenant ID: ');
    const name = await question('App Name: ');
    const bundleId = await question('Bundle Identifier (com.yourcompany.tenantname): ');
    const primaryColor = await question('Primary Color (default #000000): ') || '#000000';
    const apiUrl = await question('API URL: ');
    const companyName = await question('Company Name: ');
    
    // Create config directories if they don't exist
    const configDir = './config';
    const tenantsDir = './config/tenants';
    const assetsDir = './assets';
    
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    if (!fs.existsSync(tenantsDir)) {
      fs.mkdirSync(tenantsDir, { recursive: true });
    }
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Check if tenant already exists
    const tenantPath = path.join(tenantsDir, `${id}.json`);
    if (fs.existsSync(tenantPath)) {
      console.error(`❌ Tenant ${id} already exists at ${tenantPath}!`);
      process.exit(1);
    }
    
    // Create tenant configuration
    const tenantConfig: TenantConfig = {
      name: name,
      slug: `${id}-app`,
      bundleIdentifier: bundleId,
      package: bundleId,
      theme: {
        primaryColor: primaryColor,
        backgroundColor: "#FFFFFF",
        secondaryColor: primaryColor + "66", // Add some transparency
        textColor: "#000000"
      },
      api: {
        baseUrl: apiUrl
      },
      features: ["basic"],
      assets: {
        icon: `./assets/${id}/icon.png`,
        splash: `./assets/${id}/splash.png`,
        logo: `./assets/${id}/logo.png`
      },
      branding: {
        appName: name.replace(' App', ''),
        companyName: companyName,
        supportEmail: `support@${id}.com`,
        website: `https://${id}.com`
      }
    };

    // Write tenant config file
    fs.writeFileSync(tenantPath, JSON.stringify(tenantConfig, null, 2));
    
    // Create asset directories
    const tenantAssetsDir = path.join(assetsDir, id);
    if (!fs.existsSync(tenantAssetsDir)) {
      fs.mkdirSync(tenantAssetsDir, { recursive: true });
      console.log(`📁 Created assets directory: ${tenantAssetsDir}`);
    }
    
    // Regenerate all workflows
    console.log('🔄 Regenerating workflows...');
    execSync('npm run config:generate', { stdio: 'inherit' });
    
    // Update main tenants index (optional - for easier discovery)
    updateTenantsIndex();
    
    console.log(`🎉 Tenant ${id} created successfully!`);
    console.log(`📝 Edit the config at: ${tenantPath}`);
    console.log(`🖼️  Add assets to: ${tenantAssetsDir}`);

    console.log(`\n🔐 Required secrets to add in GitHub:`);
    const secretsPrefix = id.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    console.log(`   ${secretsPrefix}_ENV_TOKEN`);
    console.log(`   ${secretsPrefix}_GOOGLE_SERVICES_TOKEN`);
    console.log(`   ${secretsPrefix}_SLACK_WEBHOOK_URL (optional)`);
    console.log(`   ${secretsPrefix}_SENTRY_AUTH_TOKEN (optional)`);

    console.log(`\n🚀 Next steps:`);
    console.log(`1. Add ${tenantAssetsDir}/icon.png (1024x1024)`);
    console.log(`2. Add ${tenantAssetsDir}/splash.png`);
    console.log(`3. Add ${tenantAssetsDir}/logo.png`);
    console.log(`4. Add the required secrets in GitHub repository settings`);
    console.log(`5. Test with: gh workflow run build-${id}-app.yml`);
    
  } catch (error) {
    console.error('Error adding tenant:', (error as Error).message);
  } finally {
    rl.close();
  }
}

const updateTenantsIndex = () => {
  try {
    const tenantsDir = './config/tenants';
    const indexPath = './config/index.ts';
    
    if (!fs.existsSync(tenantsDir)) return;
    
    // Get all tenant files
    const tenantFiles = fs.readdirSync(tenantsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
    
    // Generate index file
    const indexContent = `// Auto-generated tenants index
// This file is automatically updated when you add/remove tenants

export const availableTenants = ${JSON.stringify(tenantFiles, null, 2)};

// Helper function to load all tenant configs
export const loadAllTenants = () => {
  const tenants: Record<string, any> = {};
  
${tenantFiles.map(tenant => 
  `  tenants['${tenant}'] = require('./tenants/${tenant}.json');`
).join('\n')}
  
  return tenants;
};

// Helper function to load specific tenant
export const loadTenant = (tenantId: string) => {
  try {
    return require(\`./tenants/\${tenantId}.json\`);
  } catch (error) {
    throw new Error(\`Tenant \${tenantId} not found\`);
  }
};
`;
    
    fs.writeFileSync(indexPath, indexContent);
    console.log(`📄 Updated tenants index: ${indexPath}`);
    
  } catch (error) {
    console.warn('Warning: Could not update tenants index:', (error as Error).message);
  }
}

createTenant();