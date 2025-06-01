// scripts/buildAll.ts
import { execSync } from 'child_process';
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

async function buildAll(): Promise<void> {
  const platform = process.argv[2] || 'all';
  const profile = process.argv[3] || 'production';
  const skipValidation = process.argv.includes('--skip-validation');
  const dryRun = process.argv.includes('--dry-run');
  
  if (!['ios', 'android', 'all'].includes(platform)) {
    console.log('❌ Usage: npm run build:all [ios|android|all] [production|preview|development] [--skip-validation] [--dry-run]');
    console.log('');
    console.log('Examples:');
    console.log('  npm run build:all ios production');
    console.log('  npm run build:all android preview --skip-validation');
    console.log('  npm run build:all all production --dry-run');
    process.exit(1);
  }

  try {
    console.log(`🚀 Building all tenants for ${platform} (${profile} profile)...\n`);
    
    if (dryRun) {
      console.log('🧪 DRY RUN MODE - No actual builds will be executed\n');
    }

    const tenantsDir = './config/tenants';
    
    if (!fs.existsSync(tenantsDir)) {
      console.log('❌ config/tenants directory not found. Create tenants first with npm run tenant:add');
      process.exit(1);
    }

    const tenantFiles = fs.readdirSync(tenantsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));

    console.log(`📱 Found ${tenantFiles.length} tenants: ${tenantFiles.join(', ')}`);

    const tenantConfigs = [];
    for (const tenantId of tenantFiles) {
      const tenantPath = path.join(tenantsDir, `${tenantId}.json`);
      
      try {
        const config: TenantConfig = JSON.parse(fs.readFileSync(tenantPath, 'utf8'));
        
        if (!config.name || !config.bundleIdentifier || !config.package) {
          console.warn(`⚠️  ${tenantId}: Missing required fields (name, bundleIdentifier, package)`);
          continue;
        }
        
        tenantConfigs.push({ id: tenantId, config });
        console.log(`✅ ${tenantId}: ${config.name}`);
        
      } catch (error) {
        console.error(`❌ ${tenantId}: Invalid JSON - ${(error as Error).message}`);
      }
    }

    if (tenantConfigs.length === 0) {
      console.error('❌ No valid tenant configurations found');
      process.exit(1);
    }

    console.log(`\n🔧 Generating EAS configuration...`);
    try {
      execSync('npm run eas:generate', { stdio: 'inherit' });
      console.log('✅ EAS configuration generated');
    } catch (error) {
      console.error('❌ Failed to generate EAS configuration:', error);
      process.exit(1);
    }

    const results: Array<{ tenant: string; success: boolean; error?: string }> = [];

    for (const { id, config } of tenantConfigs) {
      console.log(`\n🏗️  Building ${id} (${config.name})...`);
      
      try {
        console.log(`📱 Generating app config for ${id}...`);
        execSync(`TENANT=${id} npm run config:generate`, { 
          stdio: 'inherit',
          env: { ...process.env, TENANT: id }
        });

        const buildProfile = `${id}-${profile}`;
        if (!hasProfile(buildProfile)) {
          console.error(`❌ Build profile '${buildProfile}' not found in eas.json`);
          results.push({ tenant: id, success: false, error: `Profile ${buildProfile} not found` });
          continue;
        }

        console.log(`🚀 Building ${id} with profile: ${buildProfile}`);
        execSync(`eas build --platform ${platform} --profile ${buildProfile} --non-interactive`, {
          stdio: 'inherit',
          env: { ...process.env, TENANT: id }
        });

        console.log(`✅ Successfully built ${id}`);
        results.push({ tenant: id, success: true });

        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Failed to build ${id}:`, error);
        results.push({ 
          tenant: id, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    console.log('\n📊 Build Summary:');
    console.log('================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful builds: ${successful.length}`);
    successful.forEach(r => console.log(`   - ${r.tenant}`));
    
    if (failed.length > 0) {
      console.log(`❌ Failed builds: ${failed.length}`);
      failed.forEach(r => console.log(`   - ${r.tenant}: ${r.error}`));
    }

    if (failed.length > 0) {
      console.log('\n❌ Some builds failed. Check the logs above for details.');
      process.exit(1);
    } else {
      console.log('\n🎉 All builds completed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error during build process:', (error as Error).message);
    process.exit(1);
  }
}

const hasProfile = (profileName: string): boolean => {
  const easConfig = JSON.parse(fs.readFileSync('./eas.json', 'utf8'));
  return !!easConfig.build?.[profileName];
};

// Helper function to show build status
function showBuildProgress(current: number, total: number, tenantName: string) {
  const progress = Math.round((current / total) * 100);
  const progressBar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
  console.log(`\n📊 Progress: [${progressBar}] ${progress}% (${current}/${total}) - ${tenantName}`);
}

buildAll();