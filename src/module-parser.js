/**
 * Module Parser - Extracts import/export statements from ES6 modules
 */
export class ModuleParser {
  /**
   * Parse import and export statements from source code
   * @param {string} source - The source code to parse
   * @returns {Object} Object containing imports and exports
   */
  parseModule(source) {
    const imports = this.parseImports(source);
    const exports = this.parseExports(source);
    
    return { imports, exports };
  }

  /**
   * Parse import statements from source code
   * @param {string} source - The source code
   * @returns {Array} Array of import objects
   */
  parseImports(source) {
    const imports = [];
    
    // Remove comments and strings to avoid false matches
    const cleanSource = this.removeCommentsAndStrings(source);
    
    // Mixed imports: import foo, { bar } from './module' - must be first
    const mixedPattern = /import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*,\s*{\s*([^}]+)\s*}\s*from\s*['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = mixedPattern.exec(cleanSource)) !== null) {
      const namedImports = match[2].split(',').map(name => name.trim());
      imports.push({
        type: 'mixed',
        specifiers: [match[1], ...namedImports],
        source: match[3]
      });
    }

    // Named imports: import { foo, bar } from './module'
    const namedPattern = /import\s*{\s*([^}]+)\s*}\s*from\s*['"`]([^'"`]+)['"`]/g;
    while ((match = namedPattern.exec(cleanSource)) !== null) {
      const namedImports = match[1].split(',').map(name => name.trim());
      imports.push({
        type: 'named',
        specifiers: namedImports,
        source: match[2]
      });
    }
    
    // Namespace imports: import * as foo from './module'
    const namespacePattern = /import\s*\*\s*as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*['"`]([^'"`]+)['"`]/g;
    while ((match = namespacePattern.exec(cleanSource)) !== null) {
      imports.push({
        type: 'namespace',
        specifiers: [match[1]],
        source: match[2]
      });
    }
    
    // Default imports: import foo from './module' - must be after namespace and mixed
    const defaultPattern = /import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*['"`]([^'"`]+)['"`]/g;
    while ((match = defaultPattern.exec(cleanSource)) !== null) {
      // Skip if this was already matched as part of mixed import
      const alreadyMatched = imports.some(imp => 
        imp.type === 'mixed' && imp.source === match[2] && imp.specifiers.includes(match[1])
      );
      
      if (!alreadyMatched) {
        imports.push({
          type: 'default',
          specifiers: [match[1]],
          source: match[2]
        });
      }
    }
    
    // Side-effect imports: import './module'
    const sideEffectPattern = /import\s*['"`]([^'"`]+)['"`]/g;
    while ((match = sideEffectPattern.exec(cleanSource)) !== null) {
      imports.push({
        type: 'side-effect',
        specifiers: [],
        source: match[1]
      });
    }

    return imports;
  }

  /**
   * Parse export statements from source code
   * @param {string} source - The source code
   * @returns {Array} Array of export objects
   */
  parseExports(source) {
    const exports = [];
    
    // Remove comments and strings to avoid false matches
    const cleanSource = this.removeCommentsAndStrings(source);
    
    // Re-exports: export { foo } from './other' - must be first to avoid confusion with named exports
    const reExportPattern = /export\s*{\s*([^}]+)\s*}\s*from\s*['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = reExportPattern.exec(cleanSource)) !== null) {
      const namedExports = match[1].split(',').map(name => name.trim());
      exports.push({
        type: 're-export',
        specifiers: namedExports,
        source: match[2]
      });
    }
    
    // Export all: export * from './other'
    const exportAllPattern = /export\s*\*\s*from\s*['"`]([^'"`]+)['"`]/g;
    while ((match = exportAllPattern.exec(cleanSource)) !== null) {
      exports.push({
        type: 'export-all',
        specifiers: ['*'],
        source: match[1]
      });
    }
    
    // Named exports: export { foo, bar } - must be after re-exports
    const namedExportPattern = /export\s*{\s*([^}]+)\s*}(?!\s*from)/g;
    while ((match = namedExportPattern.exec(cleanSource)) !== null) {
      const namedExports = match[1].split(',').map(name => name.trim());
      exports.push({
        type: 'named',
        specifiers: namedExports,
        source: null
      });
    }
    
    // Default exports: export default foo
    const defaultExportPattern = /export\s+default\s+(.+?)(?=;|$|\n)/g;
    while ((match = defaultExportPattern.exec(cleanSource)) !== null) {
      exports.push({
        type: 'default',
        specifiers: ['default'],
        source: null
      });
    }
    
    // Direct exports: export const foo = 'bar'
    const directExportPattern = /export\s+(const|let|var|function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    while ((match = directExportPattern.exec(cleanSource)) !== null) {
      exports.push({
        type: 'direct',
        specifiers: [match[2]],
        source: null
      });
    }

    return exports;
  }

  /**
   * Remove comments and string literals to avoid false regex matches
   * @param {string} source - The source code
   * @returns {string} Clean source code
   */
  removeCommentsAndStrings(source) {
    // First, remove comments
    let clean = source
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/\/\/.*$/gm, ''); // Remove // comments
    
    // Replace string literals with placeholders, but preserve import/export statements
    // We need to be careful not to break import/export statements
    clean = clean
      .replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, match => {
        // If this string is part of an import/export statement, keep it
        const beforeMatch = clean.substring(0, clean.indexOf(match));
        const lastImportOrExport = Math.max(
          beforeMatch.lastIndexOf('import'),
          beforeMatch.lastIndexOf('export')
        );
        const lastSemicolon = beforeMatch.lastIndexOf(';');
        
        // If we're inside an import/export statement (no semicolon after last import/export)
        if (lastImportOrExport > lastSemicolon) {
          return match; // Keep the original string
        }
        return '""'; // Replace with placeholder
      })
      .replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, match => {
        const beforeMatch = clean.substring(0, clean.indexOf(match));
        const lastImportOrExport = Math.max(
          beforeMatch.lastIndexOf('import'),
          beforeMatch.lastIndexOf('export')
        );
        const lastSemicolon = beforeMatch.lastIndexOf(';');
        
        if (lastImportOrExport > lastSemicolon) {
          return match;
        }
        return "''";
      })
      .replace(/`[^`\\]*(?:\\.[^`\\]*)*`/g, match => {
        const beforeMatch = clean.substring(0, clean.indexOf(match));
        const lastImportOrExport = Math.max(
          beforeMatch.lastIndexOf('import'),
          beforeMatch.lastIndexOf('export')
        );
        const lastSemicolon = beforeMatch.lastIndexOf(';');
        
        if (lastImportOrExport > lastSemicolon) {
          return match;
        }
        return '``';
      });
    
    return clean;
  }
}