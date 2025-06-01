// scripts/generateConfigs.ts
import * as fs from 'fs';
import * as path from 'path';
import { generateAppConfig } from './generateAppConfig';
import { generateEasConfig } from './generateEasConfig';

const main = () => {
  try {
    console.log('🔧 Generating configurations...\n');

    // Generate app.config.ts if tenant is specified
    const tenantId = process.env.TENANT; // Updated from TENANT
    if (tenantId) {
      console.log(`📱 Generating app config for tenant: ${tenantId}`);
      
      // Verify tenant exists
      const tenantPath = path.join('./config/tenants', `${tenantId}.json`);
      if (!fs.existsSync(tenantPath)) {
        const tenantsDir = './config/tenants';
        const availableTenants = fs.existsSync(tenantsDir) 
          ? fs.readdirSync(tenantsDir)
              .filter(file => file.endsWith('.json'))
              .map(file => file.replace('.json', ''))
          : [];
        
        throw new Error(
          `Tenant ${tenantId} not found. Available tenants: ${availableTenants.join(', ')}`
        );
      }

      const appConfig = generateAppConfig(tenantId);
      const configContent = `// Auto-generated app.config.ts for tenant: ${tenantId}
// Generated at: ${new Date().toISOString()}
import { ExpoConfig } from 'expo/config';

const config: { expo: ExpoConfig } = ${JSON.stringify(appConfig, null, 2)};

export default config;
`;
      fs.writeFileSync('./app.config.ts', configContent);
      console.log(`✅ Generated app.config.ts for tenant: ${tenantId}`);
    } else {
      console.log('ℹ️  No TENANT specified, skipping app.config.ts generation');
      console.log('   Set TENANT=<tenantId> to generate tenant-specific config');
    }

    // Generate eas.json
    console.log('\n📦 Generating EAS configuration...');
    const easConfig = generateEasConfig();
    fs.writeFileSync('./eas.json', JSON.stringify(easConfig, null, 2));
    console.log('✅ Generated eas.json');

    // Optional: Generate tenant overview
    console.log('\n📊 Generating tenant overview...');
    generateTenantOverview();

    console.log('\n🎉 Configuration generation completed!');
    
    if (tenantId) {
      console.log(`\n🚀 Quick start:`);
      console.log(`   TENANT=${tenantId} expo start`);
      console.log(`   eas build --profile ${tenantId}-production --platform ios`);
    } else {
      console.log(`\n💡 To generate tenant-specific config:`);
      console.log(`   TENANT=<tenantId> npm run config:generate`);
    }

  } catch (error) {
    console.error('❌ Error generating configurations:', (error as Error).message);
    process.exit(1);
  }
};

// Helper function to generate a tenant overview
const generateTenantOverview = () => {
  try {
    const tenantsDir = './config/tenants';
    
    if (!fs.existsSync(tenantsDir)) {
      console.log('⚠️  No tenants directory found, skipping overview generation');
      return;
    }

    const tenantFiles = fs.readdirSync(tenantsDir)
      .filter(file => file.endsWith('.json'));

    if (tenantFiles.length === 0) {
      console.log('⚠️  No tenant configurations found');
      return;
    }

    const overview = {
      generated: new Date().toISOString(),
      totalTenants: tenantFiles.length,
      tenants: {} as Record<string, any>
    };

    tenantFiles.forEach(file => {
      try {
        const tenantId = file.replace('.json', '');
        const tenantPath = path.join(tenantsDir, file);
        const tenant = JSON.parse(fs.readFileSync(tenantPath, 'utf8'));
        
        overview.tenants[tenantId] = {
          name: tenant.name,
          bundleIdentifier: tenant.bundleIdentifier,
          package: tenant.package,
          features: tenant.features,
          apiUrl: tenant.api?.baseUrl,
          primaryColor: tenant.theme?.primaryColor,
          configFile: `./config/tenants/${file}`
        };
      } catch (error) {
        console.warn(`⚠️  Error processing ${file}: ${(error as Error).message}`);
        overview.tenants[file.replace('.json', '')] = {
          error: (error as Error).message
        };
      }
    });

    // Save overview
    fs.writeFileSync('./tenant-overview.json', JSON.stringify(overview, null, 2));
    console.log(`✅ Generated tenant overview (${tenantFiles.length} tenants)`);

    // Generate markdown documentation
    generateTenantDocs(overview);

  } catch (error) {
    console.warn('⚠️  Could not generate tenant overview:', (error as Error).message);
  }
};

// Helper function to generate markdown documentation
const generateTenantDocs = (overview: any) => {
  try {
    const markdown = `# Tenant Configuration Overview

Generated: ${overview.generated}
Total Tenants: ${overview.totalTenants}

## Available Tenants

| Tenant ID | App Name | Bundle ID | Features | Primary Color |
|-----------|----------|-----------|----------|---------------|
${Object.entries(overview.tenants).map(([id, config]: [string, any]) => {
  if (config.error) {
    return `| ${id} | ❌ Error | - | - | - |`;
  }
  return `| ${id} | ${config.name} | ${config.bundleIdentifier} | ${config.features?.join(', ') || 'none'} | ${config.primaryColor || 'N/A'} |`;
}).join('\n')}

## Quick Commands

### Development
\`\`\`bash
# Start development server for specific tenant
TENANT=<tenantId> expo start

# Examples:
${Object.keys(overview.tenants).slice(0, 3).map(id => 
  `TENANT=${id} expo start`
).join('\n')}
\`\`\`

### Building
\`\`\`bash
# Build specific tenant
eas build --profile <tenantId>-production --platform <ios|android>

# Build all tenants
npm run build:all

# Examples:
${Object.keys(overview.tenants).slice(0, 2).map(id => 
  `eas build --profile ${id}-production --platform ios`
).join('\n')}
\`\`\`

### Management
\`\`\`bash
# List all tenants
npm run tenant:list

# Get tenant details
npm run tenant:info <tenantId>

# Validate all tenant configs
npm run tenant:validate

# Add new tenant
npm run tenant:add
\`\`\`

## Configuration Files

${Object.entries(overview.tenants).map(([id, config]: [string, any]) => {
  if (config.error) {
    return `- **${id}**: ❌ ${config.error}`;
  }
  return `- **${id}**: \`${config.configFile}\``;
}).join('\n')}

---
*This documentation is auto-generated. Run \`npm run config:generate\` to update.*
`;

    fs.writeFileSync('./TENANTS.md', markdown);
    console.log('✅ Generated tenant documentation (TENANTS.md)');

  } catch (error) {
    console.warn('⚠️  Could not generate tenant documentation:', (error as Error).message);
  }
};

main();