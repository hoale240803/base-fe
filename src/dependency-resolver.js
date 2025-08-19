import { promises as fs } from 'fs';
import path from 'path';
import { ModuleParser } from './module-parser.js';
import { ModuleResolver } from './module-resolver.js';
import { DependencyGraph } from './dependency-graph.js';

/**
 * Dependency Resolver - Main class for resolving ES6 module dependencies
 */
export class DependencyResolver {
  constructor(options = {}) {
    this.options = {
      extensions: ['.js', '.mjs', '.ts'],
      baseDir: process.cwd(),
      ...options
    };
    
    this.parser = new ModuleParser();
    this.resolver = new ModuleResolver(this.options);
    this.graph = new DependencyGraph();
    
    // Cache for parsed modules to avoid re-parsing
    this.moduleCache = new Map();
  }

  /**
   * Resolve dependencies starting from entry points
   * @param {string|Array<string>} entryPoints - Entry point file(s)
   * @returns {Promise<DependencyGraph>} The complete dependency graph
   */
  async resolve(entryPoints) {
    const entries = Array.isArray(entryPoints) ? entryPoints : [entryPoints];
    const visited = new Set();
    const processing = new Set();

    // Resolve each entry point
    for (const entryPoint of entries) {
      const resolvedEntry = await this.resolver.resolve(entryPoint, this.options.baseDir);
      await this._resolveModule(resolvedEntry, visited, processing);
    }

    return this.graph;
  }

  /**
   * Recursively resolve a module and its dependencies
   * @param {string} modulePath - Absolute path to the module
   * @param {Set} visited - Set of already visited modules
   * @param {Set} processing - Set of currently processing modules (for cycle detection)
   * @private
   */
  async _resolveModule(modulePath, visited, processing) {
    // Normalize the module path
    const normalizedPath = path.resolve(modulePath);
    
    // Check if already visited
    if (visited.has(normalizedPath)) {
      return;
    }
    
    // Check for circular dependency during processing
    if (processing.has(normalizedPath)) {
      throw new Error(`Circular dependency detected involving: ${normalizedPath}`);
    }
    
    processing.add(normalizedPath);
    
    try {
      // Read and parse the module
      const moduleInfo = await this._parseModuleFile(normalizedPath);
      
      // Add module to graph
      this.graph.addModule(normalizedPath, moduleInfo);
      
      // Process imports
      for (const importInfo of moduleInfo.imports) {
        try {
          const resolvedImport = await this.resolver.resolve(importInfo.source, normalizedPath);
          const normalizedImport = path.resolve(resolvedImport);
          
          // Add dependency relationship
          this.graph.addDependency(normalizedPath, normalizedImport);
          
          // Recursively resolve the imported module
          await this._resolveModule(normalizedImport, visited, processing);
          
        } catch (error) {
          throw new Error(`Failed to resolve import '${importInfo.source}' in ${normalizedPath}: ${error.message}`);
        }
      }
      
      // Process re-exports
      for (const exportInfo of moduleInfo.exports) {
        if (exportInfo.source) {
          try {
            const resolvedExport = await this.resolver.resolve(exportInfo.source, normalizedPath);
            const normalizedExport = path.resolve(resolvedExport);
            
            // Add dependency relationship for re-exports
            this.graph.addDependency(normalizedPath, normalizedExport);
            
            // Recursively resolve the re-exported module
            await this._resolveModule(normalizedExport, visited, processing);
            
          } catch (error) {
            throw new Error(`Failed to resolve re-export '${exportInfo.source}' in ${normalizedPath}: ${error.message}`);
          }
        }
      }
      
    } catch (error) {
      throw new Error(`Failed to process module ${normalizedPath}: ${error.message}`);
    } finally {
      processing.delete(normalizedPath);
      visited.add(normalizedPath);
    }
  }

  /**
   * Parse a module file and cache the result
   * @param {string} filePath - Absolute path to the module file
   * @returns {Promise<Object>} Parsed module information
   * @private
   */
  async _parseModuleFile(filePath) {
    // Check cache first
    if (this.moduleCache.has(filePath)) {
      return this.moduleCache.get(filePath);
    }
    
    try {
      const source = await fs.readFile(filePath, 'utf8');
      const parsed = this.parser.parseModule(source);
      
      const moduleInfo = {
        path: filePath,
        relativePath: this.resolver.getRelativePath(filePath),
        imports: parsed.imports,
        exports: parsed.exports,
        source: source
      };
      
      // Cache the result
      this.moduleCache.set(filePath, moduleInfo);
      
      return moduleInfo;
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Module file not found: ${filePath}`);
      }
      throw new Error(`Failed to read module file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Get the dependency graph
   * @returns {DependencyGraph} The current dependency graph
   */
  getGraph() {
    return this.graph;
  }

  /**
   * Get modules in topological order (safe loading order)
   * @returns {Array<string>} Array of module paths in loading order
   */
  getModuleOrder() {
    try {
      return this.graph.topologicalSort();
    } catch (error) {
      throw new Error(`Cannot determine module order: ${error.message}`);
    }
  }

  /**
   * Detect circular dependencies
   * @returns {Array<Array<string>>} Array of circular dependency chains
   */
  detectCircularDependencies() {
    return this.graph.detectCircularDependencies();
  }

  /**
   * Get detailed information about all modules
   * @returns {Object} Object containing module information
   */
  getModuleInfo() {
    const modules = {};
    
    for (const modulePath of this.graph.getAllModules()) {
      const moduleData = this.graph.getModule(modulePath);
      const dependencies = this.graph.getDependencies(modulePath);
      const dependents = this.graph.getDependents(modulePath);
      
      modules[modulePath] = {
        ...moduleData,
        dependencies,
        dependents,
        dependencyCount: dependencies.length,
        dependentCount: dependents.length
      };
    }
    
    return modules;
  }

  /**
   * Get statistics about the dependency graph
   * @returns {Object} Graph statistics
   */
  getStatistics() {
    const size = this.graph.getSize();
    const cycles = this.detectCircularDependencies();
    const modules = this.graph.getAllModules();
    
    let maxDependencies = 0;
    let maxDependents = 0;
    
    for (const module of modules) {
      const depCount = this.graph.getDependencies(module).length;
      const dependendtCount = this.graph.getDependents(module).length;
      
      maxDependencies = Math.max(maxDependencies, depCount);
      maxDependents = Math.max(maxDependents, dependendtCount);
    }
    
    return {
      totalModules: size.modules,
      totalDependencies: size.dependencies,
      circularDependencies: cycles.length,
      maxDependenciesPerModule: maxDependencies,
      maxDependentsPerModule: maxDependents,
      averageDependenciesPerModule: size.modules > 0 ? (size.dependencies / size.modules).toFixed(2) : 0
    };
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.moduleCache.clear();
    this.graph = new DependencyGraph();
  }

  /**
   * Export the dependency graph to JSON
   * @returns {Object} JSON representation of the graph
   */
  toJSON() {
    return {
      modules: this.getModuleInfo(),
      statistics: this.getStatistics(),
      moduleOrder: this.getModuleOrder(),
      circularDependencies: this.detectCircularDependencies()
    };
  }
}