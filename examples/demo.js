#!/usr/bin/env node

/**
 * Demo script showing how to use the DependencyResolver
 */

import path from 'path';
import { DependencyResolver } from '../src/index.js';

async function demo() {
  console.log('🔗 Dependency Graph Resolution Demo\n');
  
  try {
    // Create resolver instance
    const resolver = new DependencyResolver({
      baseDir: path.join(process.cwd(), 'examples/sample-project'),
      extensions: ['.js', '.mjs', '.ts']
    });
    
    // Resolve dependencies
    console.log('📂 Resolving dependencies from main.js...');
    const entryPoint = path.join(process.cwd(), 'examples/sample-project/main.js');
    const graph = await resolver.resolve(entryPoint);
    
    // Show results
    console.log('\n📊 Results:');
    console.log('='.repeat(50));
    
    // Statistics
    const stats = resolver.getStatistics();
    console.log(`📈 Statistics:`);
    console.log(`   Total modules: ${stats.totalModules}`);
    console.log(`   Total dependencies: ${stats.totalDependencies}`);
    console.log(`   Circular dependencies: ${stats.circularDependencies}`);
    console.log(`   Average dependencies per module: ${stats.averageDependenciesPerModule}`);
    
    // Module order
    console.log(`\n🔄 Module loading order:`);
    const order = resolver.getModuleOrder();
    order.forEach((module, index) => {
      const relativePath = path.relative(process.cwd(), module);
      console.log(`   ${index + 1}. ${relativePath}`);
    });
    
    // Dependency relationships
    console.log(`\n🔗 Dependency relationships:`);
    const moduleInfo = resolver.getModuleInfo();
    for (const [modulePath, info] of Object.entries(moduleInfo)) {
      const relativePath = path.relative(process.cwd(), modulePath);
      console.log(`   ${relativePath}:`);
      
      if (info.dependencies.length > 0) {
        console.log(`     depends on:`);
        info.dependencies.forEach(dep => {
          const relDep = path.relative(process.cwd(), dep);
          console.log(`       - ${relDep}`);
        });
      }
      
      if (info.dependents.length > 0) {
        console.log(`     depended by:`);
        info.dependents.forEach(dep => {
          const relDep = path.relative(process.cwd(), dep);
          console.log(`       - ${relDep}`);
        });
      }
      
      console.log();
    }
    
    // Export to JSON
    console.log('💾 JSON export available via resolver.toJSON()');
    
    console.log('\n✅ Demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo();
}