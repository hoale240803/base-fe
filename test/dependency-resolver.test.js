import path from 'path';
import { DependencyResolver } from '../src/dependency-resolver.js';
import { test, assertEquals, assertTrue, assertThrowsAsync } from './test-runner.js';

// Test basic dependency resolution
test('Resolve simple dependency graph', async () => {
  const resolver = new DependencyResolver({
    baseDir: path.join(process.cwd(), 'examples/sample-project')
  });
  
  const entryPoint = path.join(process.cwd(), 'examples/sample-project/main.js');
  const graph = await resolver.resolve(entryPoint);
  
  const modules = graph.getAllModules();
  assertTrue(modules.length >= 3); // main.js, utils.js, component.js
  
  // Check that main.js exists in the graph
  const mainModule = modules.find(m => m.endsWith('main.js'));
  assertTrue(mainModule !== undefined);
  
  // Check dependencies
  const mainDeps = graph.getDependencies(mainModule);
  assertTrue(mainDeps.some(dep => dep.endsWith('utils.js')));
  assertTrue(mainDeps.some(dep => dep.endsWith('component.js')));
});

// Test module order (topological sort)
test('Get module loading order', async () => {
  const resolver = new DependencyResolver({
    baseDir: path.join(process.cwd(), 'examples/sample-project')
  });
  
  const entryPoint = path.join(process.cwd(), 'examples/sample-project/main.js');
  await resolver.resolve(entryPoint);
  
  const order = resolver.getModuleOrder();
  assertTrue(order.length >= 3);
  
  // utils.js should come before component.js (component depends on utils)
  const utilsIndex = order.findIndex(m => m.endsWith('utils.js'));
  const componentIndex = order.findIndex(m => m.endsWith('component.js'));
  const mainIndex = order.findIndex(m => m.endsWith('main.js'));
  
  assertTrue(utilsIndex < componentIndex);
  assertTrue(componentIndex < mainIndex || utilsIndex < mainIndex);
});

// Test module information
test('Get detailed module info', async () => {
  const resolver = new DependencyResolver({
    baseDir: path.join(process.cwd(), 'examples/sample-project')
  });
  
  const entryPoint = path.join(process.cwd(), 'examples/sample-project/main.js');
  await resolver.resolve(entryPoint);
  
  const moduleInfo = resolver.getModuleInfo();
  const modules = Object.keys(moduleInfo);
  
  assertTrue(modules.length >= 3);
  
  // Check that each module has the expected properties
  for (const modulePath of modules) {
    const info = moduleInfo[modulePath];
    assertTrue(info.hasOwnProperty('imports'));
    assertTrue(info.hasOwnProperty('exports'));
    assertTrue(info.hasOwnProperty('dependencies'));
    assertTrue(info.hasOwnProperty('dependents'));
  }
});

// Test statistics
test('Get graph statistics', async () => {
  const resolver = new DependencyResolver({
    baseDir: path.join(process.cwd(), 'examples/sample-project')
  });
  
  const entryPoint = path.join(process.cwd(), 'examples/sample-project/main.js');
  await resolver.resolve(entryPoint);
  
  const stats = resolver.getStatistics();
  
  assertTrue(stats.totalModules >= 3);
  assertTrue(stats.totalDependencies >= 2);
  assertEquals(stats.circularDependencies, 0);
  assertTrue(stats.averageDependenciesPerModule >= 0);
});

// Test JSON export
test('Export to JSON', async () => {
  const resolver = new DependencyResolver({
    baseDir: path.join(process.cwd(), 'examples/sample-project')
  });
  
  const entryPoint = path.join(process.cwd(), 'examples/sample-project/main.js');
  await resolver.resolve(entryPoint);
  
  const json = resolver.toJSON();
  
  assertTrue(json.hasOwnProperty('modules'));
  assertTrue(json.hasOwnProperty('statistics'));
  assertTrue(json.hasOwnProperty('moduleOrder'));
  assertTrue(json.hasOwnProperty('circularDependencies'));
});

// Test missing file error
test('Handle missing file error', async () => {
  const resolver = new DependencyResolver();
  
  await assertThrowsAsync(
    async () => await resolver.resolve('/nonexistent/file.js'),
    'not found',
    'Should throw error for missing file'
  );
});

// Test clearing cache
test('Clear cache functionality', async () => {
  const resolver = new DependencyResolver({
    baseDir: path.join(process.cwd(), 'examples/sample-project')
  });
  
  const entryPoint = path.join(process.cwd(), 'examples/sample-project/main.js');
  await resolver.resolve(entryPoint);
  
  assertTrue(resolver.getGraph().getAllModules().length > 0);
  
  resolver.clearCache();
  
  assertEquals(resolver.getGraph().getAllModules().length, 0);
});