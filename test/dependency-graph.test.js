import { DependencyGraph } from '../src/dependency-graph.js';
import { test, assertEquals, assertTrue, assertThrows } from './test-runner.js';

// Test basic graph operations
test('Add modules to graph', () => {
  const graph = new DependencyGraph();
  
  graph.addModule('/path/a.js', { imports: [], exports: [] });
  graph.addModule('/path/b.js', { imports: [], exports: [] });
  
  assertEquals(graph.getAllModules().length, 2);
  assertTrue(graph.hasModule('/path/a.js'));
  assertTrue(graph.hasModule('/path/b.js'));
});

// Test dependency relationships
test('Add dependencies', () => {
  const graph = new DependencyGraph();
  
  graph.addModule('/path/a.js', { imports: [], exports: [] });
  graph.addModule('/path/b.js', { imports: [], exports: [] });
  graph.addDependency('/path/a.js', '/path/b.js');
  
  assertEquals(graph.getDependencies('/path/a.js'), ['/path/b.js']);
  assertEquals(graph.getDependents('/path/b.js'), ['/path/a.js']);
});

// Test topological sort with simple case
test('Topological sort - simple case', () => {
  const graph = new DependencyGraph();
  
  // a -> b -> c
  graph.addModule('/path/a.js', { imports: [], exports: [] });
  graph.addModule('/path/b.js', { imports: [], exports: [] });
  graph.addModule('/path/c.js', { imports: [], exports: [] });
  
  graph.addDependency('/path/a.js', '/path/b.js');
  graph.addDependency('/path/b.js', '/path/c.js');
  
  const sorted = graph.topologicalSort();
  
  // c should come before b, b should come before a
  const cIndex = sorted.indexOf('/path/c.js');
  const bIndex = sorted.indexOf('/path/b.js');
  const aIndex = sorted.indexOf('/path/a.js');
  
  assertTrue(cIndex < bIndex);
  assertTrue(bIndex < aIndex);
});

// Test topological sort with complex case
test('Topological sort - complex case', () => {
  const graph = new DependencyGraph();
  
  // Complex graph: a->b, a->c, b->d, c->d, d->e
  const modules = ['a', 'b', 'c', 'd', 'e'].map(name => `/path/${name}.js`);
  modules.forEach(module => {
    graph.addModule(module, { imports: [], exports: [] });
  });
  
  graph.addDependency('/path/a.js', '/path/b.js');
  graph.addDependency('/path/a.js', '/path/c.js');
  graph.addDependency('/path/b.js', '/path/d.js');
  graph.addDependency('/path/c.js', '/path/d.js');
  graph.addDependency('/path/d.js', '/path/e.js');
  
  const sorted = graph.topologicalSort();
  
  // e should come before d, d before b and c, b and c before a
  const indices = {};
  sorted.forEach((module, index) => {
    indices[module] = index;
  });
  
  assertTrue(indices['/path/e.js'] < indices['/path/d.js']);
  assertTrue(indices['/path/d.js'] < indices['/path/b.js']);
  assertTrue(indices['/path/d.js'] < indices['/path/c.js']);
  assertTrue(indices['/path/b.js'] < indices['/path/a.js']);
  assertTrue(indices['/path/c.js'] < indices['/path/a.js']);
});

// Test circular dependency detection
test('Detect circular dependencies', () => {
  const graph = new DependencyGraph();
  
  // Create circular dependency: a -> b -> c -> a
  graph.addModule('/path/a.js', { imports: [], exports: [] });
  graph.addModule('/path/b.js', { imports: [], exports: [] });
  graph.addModule('/path/c.js', { imports: [], exports: [] });
  
  graph.addDependency('/path/a.js', '/path/b.js');
  graph.addDependency('/path/b.js', '/path/c.js');
  graph.addDependency('/path/c.js', '/path/a.js');
  
  const cycles = graph.detectCircularDependencies();
  
  assertTrue(cycles.length > 0);
  assertTrue(cycles.some(cycle => 
    cycle.includes('/path/a.js') && 
    cycle.includes('/path/b.js') && 
    cycle.includes('/path/c.js')
  ));
});

// Test topological sort with circular dependencies
test('Topological sort with circular dependencies throws error', () => {
  const graph = new DependencyGraph();
  
  graph.addModule('/path/a.js', { imports: [], exports: [] });
  graph.addModule('/path/b.js', { imports: [], exports: [] });
  
  graph.addDependency('/path/a.js', '/path/b.js');
  graph.addDependency('/path/b.js', '/path/a.js');
  
  assertThrows(() => graph.topologicalSort(), 'Circular dependencies detected');
});

// Test graph size calculation
test('Calculate graph size', () => {
  const graph = new DependencyGraph();
  
  graph.addModule('/path/a.js', { imports: [], exports: [] });
  graph.addModule('/path/b.js', { imports: [], exports: [] });
  graph.addModule('/path/c.js', { imports: [], exports: [] });
  
  graph.addDependency('/path/a.js', '/path/b.js');
  graph.addDependency('/path/a.js', '/path/c.js');
  
  const size = graph.getSize();
  
  assertEquals(size.modules, 3);
  assertEquals(size.dependencies, 2);
});

// Test module removal
test('Remove module from graph', () => {
  const graph = new DependencyGraph();
  
  graph.addModule('/path/a.js', { imports: [], exports: [] });
  graph.addModule('/path/b.js', { imports: [], exports: [] });
  graph.addDependency('/path/a.js', '/path/b.js');
  
  graph.removeModule('/path/b.js');
  
  assertEquals(graph.getAllModules().length, 1);
  assertTrue(!graph.hasModule('/path/b.js'));
  assertEquals(graph.getDependencies('/path/a.js'), []);
});

// Test graph string representation
test('Graph toString method', () => {
  const graph = new DependencyGraph();
  
  graph.addModule('/path/a.js', { imports: [], exports: [] });
  graph.addModule('/path/b.js', { imports: [], exports: [] });
  graph.addDependency('/path/a.js', '/path/b.js');
  
  const str = graph.toString();
  
  assertTrue(str.includes('Dependency Graph:'));
  assertTrue(str.includes('/path/a.js'));
  assertTrue(str.includes('/path/b.js'));
});