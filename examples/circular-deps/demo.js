#!/usr/bin/env node

/**
 * Demo script showing circular dependency detection
 */

import path from 'path';
import { DependencyResolver } from '../../src/index.js';

async function circulardemo() {
  console.log('🔄 Circular Dependency Detection Demo\n');
  
  try {
    // Create resolver instance
    const resolver = new DependencyResolver({
      baseDir: path.join(process.cwd(), 'examples/circular-deps'),
      extensions: ['.js', '.mjs', '.ts']
    });
    
    // Try to resolve dependencies (this should detect the circular dependency)
    console.log('📂 Attempting to resolve dependencies from moduleA.js...');
    const entryPoint = path.join(process.cwd(), 'examples/circular-deps/moduleA.js');
    
    try {
      const graph = await resolver.resolve(entryPoint);
      
      console.log('\n✅ Dependencies resolved successfully!');
      
      // Check for circular dependencies
      const cycles = resolver.detectCircularDependencies();
      
      if (cycles.length > 0) {
        console.log('\n⚠️  Circular dependencies detected:');
        cycles.forEach((cycle, index) => {
          console.log(`   ${index + 1}. ${cycle.map(m => path.relative(process.cwd(), m)).join(' -> ')}`);
        });
      } else {
        console.log('\n✅ No circular dependencies found');
      }
      
      // Try to get module order (this should throw an error)
      try {
        const order = resolver.getModuleOrder();
        console.log('\n🔄 Module loading order:', order.map(m => path.relative(process.cwd(), m)));
      } catch (error) {
        console.log('\n❌ Cannot determine module loading order:', error.message);
      }
      
    } catch (error) {
      console.log('\n❌ Resolution failed:', error.message);
    }
    
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
  circulardemo();
}