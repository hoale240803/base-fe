import { ModuleParser } from '../src/module-parser.js';
import { test, assertEquals, assertTrue } from './test-runner.js';

const parser = new ModuleParser();

// Test named imports
test('Parse named imports', () => {
  const source = `import { foo, bar } from './module';`;
  const result = parser.parseImports(source);
  
  assertEquals(result.length, 1);
  assertEquals(result[0].type, 'named');
  assertEquals(result[0].specifiers, ['foo', 'bar']);
  assertEquals(result[0].source, './module');
});

// Test default imports
test('Parse default imports', () => {
  const source = `import foo from './module';`;
  const result = parser.parseImports(source);
  
  assertEquals(result.length, 1);
  assertEquals(result[0].type, 'default');
  assertEquals(result[0].specifiers, ['foo']);
  assertEquals(result[0].source, './module');
});

// Test namespace imports
test('Parse namespace imports', () => {
  const source = `import * as foo from './module';`;
  const result = parser.parseImports(source);
  
  assertEquals(result.length, 1);
  assertEquals(result[0].type, 'namespace');
  assertEquals(result[0].specifiers, ['foo']);
  assertEquals(result[0].source, './module');
});

// Test side-effect imports
test('Parse side-effect imports', () => {
  const source = `import './module';`;
  const result = parser.parseImports(source);
  
  assertEquals(result.length, 1);
  assertEquals(result[0].type, 'side-effect');
  assertEquals(result[0].specifiers, []);
  assertEquals(result[0].source, './module');
});

// Test named exports
test('Parse named exports', () => {
  const source = `export { foo, bar };`;
  const result = parser.parseExports(source);
  
  assertEquals(result.length, 1);
  assertEquals(result[0].type, 'named');
  assertEquals(result[0].specifiers, ['foo', 'bar']);
  assertEquals(result[0].source, null);
});

// Test default exports
test('Parse default exports', () => {
  const source = `export default foo;`;
  const result = parser.parseExports(source);
  
  assertEquals(result.length, 1);
  assertEquals(result[0].type, 'default');
  assertEquals(result[0].specifiers, ['default']);
  assertEquals(result[0].source, null);
});

// Test re-exports
test('Parse re-exports', () => {
  const source = `export { foo } from './other';`;
  const result = parser.parseExports(source);
  
  assertEquals(result.length, 1);
  assertEquals(result[0].type, 're-export');
  assertEquals(result[0].specifiers, ['foo']);
  assertEquals(result[0].source, './other');
});

// Test direct exports
test('Parse direct exports', () => {
  const source = `export const foo = 'bar';`;
  const result = parser.parseExports(source);
  
  assertEquals(result.length, 1);
  assertEquals(result[0].type, 'direct');
  assertEquals(result[0].specifiers, ['foo']);
  assertEquals(result[0].source, null);
});

// Test complex module parsing
test('Parse complex module', () => {
  const source = `
    import React from 'react';
    import { useState, useEffect } from 'react';
    import * as utils from './utils';
    import './styles.css';
    
    export const Component = () => {};
    export default Component;
    export { utils } from './utils';
  `;
  
  const result = parser.parseModule(source);
  
  // Check imports
  assertTrue(result.imports.length >= 4);
  assertTrue(result.imports.some(imp => imp.type === 'default' && imp.source === 'react'));
  assertTrue(result.imports.some(imp => imp.type === 'named' && imp.source === 'react'));
  assertTrue(result.imports.some(imp => imp.type === 'namespace' && imp.source === './utils'));
  assertTrue(result.imports.some(imp => imp.type === 'side-effect' && imp.source === './styles.css'));
  
  // Check exports
  assertTrue(result.exports.length >= 3);
  assertTrue(result.exports.some(exp => exp.type === 'direct'));
  assertTrue(result.exports.some(exp => exp.type === 'default'));
  assertTrue(result.exports.some(exp => exp.type === 're-export'));
});

// Test comment and string removal
test('Parse module with comments and strings', () => {
  const source = `
    // This is a comment with import statement
    /* This is a 
       multiline comment with import { fake } from 'fake' */
    const str = "import { fake } from 'fake'";
    const template = \`import { fake } from 'fake'\`;
    import { real } from './real';
  `;
  
  const result = parser.parseImports(source);
  
  assertEquals(result.length, 1);
  assertEquals(result[0].source, './real');
});