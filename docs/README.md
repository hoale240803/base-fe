# Dependency Graph Resolution

A comprehensive ES6 module bundler dependency resolution system that analyzes import/export relationships between modules and builds a complete dependency graph.

## Features

- ✅ **ES6 Module Parsing** - Parse all types of import/export statements
  - Named imports: `import { foo, bar } from './module'`
  - Default imports: `import foo from './module'`
  - Namespace imports: `import * as foo from './module'`
  - Side-effect imports: `import './module'`
  - Mixed imports: `import foo, { bar } from './module'`
  - Named exports: `export { foo, bar }`
  - Default exports: `export default foo`
  - Re-exports: `export { foo } from './other'`
  - Direct exports: `export const foo = 'bar'`

- ✅ **Module Resolution** - Node.js-style module resolution
  - Relative paths (`./`, `../`)
  - Absolute paths
  - File extensions (.js, .mjs, .ts)
  - Index files and directory imports
  - Package.json main field support

- ✅ **Dependency Graph Construction**
  - Build directed dependency graph
  - Track import/export relationships
  - Store module metadata
  - Detect circular dependencies
  - Topological sorting for safe loading order

- ✅ **Error Handling**
  - Missing module errors
  - Circular dependency warnings
  - Invalid import/export syntax handling
  - File access errors

## Usage

### Basic Usage

```javascript
import { DependencyResolver } from './src/index.js';

const resolver = new DependencyResolver({
  baseDir: process.cwd(),
  extensions: ['.js', '.mjs', '.ts']
});

// Resolve dependencies from entry point
const graph = await resolver.resolve('./src/main.js');

// Get modules in loading order
const moduleOrder = resolver.getModuleOrder();

// Check for circular dependencies
const cycles = resolver.detectCircularDependencies();

// Get detailed statistics
const stats = resolver.getStatistics();
```

### API Reference

#### `DependencyResolver`

##### Constructor
```javascript
new DependencyResolver(options)
```

Options:
- `baseDir`: Base directory for module resolution (default: `process.cwd()`)
- `extensions`: File extensions to try (default: `['.js', '.mjs', '.ts']`)

##### Methods

**`async resolve(entryPoints)`**
- Resolves dependencies starting from one or more entry points
- Returns: `DependencyGraph` instance
- Throws: Error if modules not found or circular dependencies detected during resolution

**`getModuleOrder()`**
- Returns modules in topologically sorted order (safe loading order)
- Returns: `Array<string>` of module paths
- Throws: Error if circular dependencies exist

**`detectCircularDependencies()`**
- Detects circular dependency chains
- Returns: `Array<Array<string>>` of circular dependency paths

**`getModuleInfo()`**
- Returns detailed information about all modules
- Returns: `Object` with module paths as keys and module metadata as values

**`getStatistics()`**
- Returns statistics about the dependency graph
- Returns: `Object` with totalModules, totalDependencies, etc.

**`toJSON()`**
- Exports complete graph information to JSON
- Returns: `Object` with modules, statistics, moduleOrder, and circularDependencies

**`clearCache()`**
- Clears internal cache and resets the graph

### Example Output

```javascript
{
  "modules": {
    "/path/to/main.js": {
      "imports": [
        { "type": "named", "specifiers": ["utils"], "source": "./utils.js" }
      ],
      "exports": [
        { "type": "default", "specifiers": ["default"], "source": null }
      ],
      "dependencies": ["/path/to/utils.js"],
      "dependents": []
    },
    "/path/to/utils.js": {
      "imports": [],
      "exports": [
        { "type": "named", "specifiers": ["utils"], "source": null }
      ],
      "dependencies": [],
      "dependents": ["/path/to/main.js"]
    }
  },
  "statistics": {
    "totalModules": 2,
    "totalDependencies": 1,
    "circularDependencies": 0,
    "averageDependenciesPerModule": "0.50"
  },
  "moduleOrder": ["/path/to/utils.js", "/path/to/main.js"],
  "circularDependencies": []
}
```

## Testing

Run the test suite:

```bash
npm test
```

Run the demo:

```bash
node examples/demo.js
```

## Implementation Details

### Module Parser
- Uses regex patterns to extract import/export statements
- Handles comments and string literals to avoid false matches
- Supports all ES6 import/export syntax variants

### Module Resolver
- Implements Node.js-style module resolution algorithm
- Handles relative and absolute paths
- Supports file extension resolution and index files
- Includes basic package.json main field support

### Dependency Graph
- Uses adjacency lists to represent dependencies
- Implements DFS-based topological sorting
- Detects circular dependencies using DFS with recursion stack
- Provides efficient graph operations

### Performance
- Caches parsed modules to avoid re-parsing
- Uses efficient graph algorithms
- Designed to handle large dependency trees (1000+ modules)

## Error Handling

The system provides clear error messages for common issues:

- **Module Not Found**: When a required module cannot be resolved
- **Circular Dependencies**: When modules have circular import relationships
- **File Access Errors**: When files cannot be read
- **Parse Errors**: When import/export syntax is invalid

## Limitations

- Basic comment/string removal (not a full parser)
- Simplified node_modules resolution
- No dynamic import analysis
- ES6 modules only (no CommonJS)

## Future Enhancements

- AST-based parsing for better accuracy
- Dynamic import support
- CommonJS module support
- Enhanced node_modules resolution
- Plugin system for custom resolvers