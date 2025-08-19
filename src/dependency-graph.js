/**
 * Dependency Graph - Represents the dependency relationships between modules
 */
export class DependencyGraph {
  constructor() {
    // Map of module path -> module info
    this.modules = new Map();
    // Map of module path -> array of dependent module paths
    this.dependencies = new Map();
    // Map of module path -> array of modules that depend on this one
    this.dependents = new Map();
  }

  /**
   * Add a module to the graph
   * @param {string} modulePath - The absolute path of the module
   * @param {Object} moduleInfo - Module metadata (imports, exports, etc.)
   */
  addModule(modulePath, moduleInfo) {
    this.modules.set(modulePath, moduleInfo);
    
    if (!this.dependencies.has(modulePath)) {
      this.dependencies.set(modulePath, []);
    }
    
    if (!this.dependents.has(modulePath)) {
      this.dependents.set(modulePath, []);
    }
  }

  /**
   * Add a dependency relationship between two modules
   * @param {string} fromModule - The module that imports
   * @param {string} toModule - The module that is imported
   */
  addDependency(fromModule, toModule) {
    // Add to dependencies map
    if (!this.dependencies.has(fromModule)) {
      this.dependencies.set(fromModule, []);
    }
    
    if (!this.dependencies.get(fromModule).includes(toModule)) {
      this.dependencies.get(fromModule).push(toModule);
    }

    // Add to dependents map
    if (!this.dependents.has(toModule)) {
      this.dependents.set(toModule, []);
    }
    
    if (!this.dependents.get(toModule).includes(fromModule)) {
      this.dependents.get(toModule).push(fromModule);
    }
  }

  /**
   * Get all modules in the graph
   * @returns {Array<string>} Array of module paths
   */
  getAllModules() {
    return Array.from(this.modules.keys());
  }

  /**
   * Get module information
   * @param {string} modulePath - The module path
   * @returns {Object|null} Module information or null if not found
   */
  getModule(modulePath) {
    return this.modules.get(modulePath) || null;
  }

  /**
   * Get direct dependencies of a module
   * @param {string} modulePath - The module path
   * @returns {Array<string>} Array of dependency paths
   */
  getDependencies(modulePath) {
    return this.dependencies.get(modulePath) || [];
  }

  /**
   * Get modules that depend on this module
   * @param {string} modulePath - The module path
   * @returns {Array<string>} Array of dependent module paths
   */
  getDependents(modulePath) {
    return this.dependents.get(modulePath) || [];
  }

  /**
   * Detect circular dependencies in the graph
   * @returns {Array<Array<string>>} Array of circular dependency chains
   */
  detectCircularDependencies() {
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    for (const module of this.modules.keys()) {
      if (!visited.has(module)) {
        this._detectCyclesFromNode(module, visited, recursionStack, [], cycles);
      }
    }

    return cycles;
  }

  /**
   * Helper method for cycle detection using DFS
   * @private
   */
  _detectCyclesFromNode(node, visited, recursionStack, path, cycles) {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const dependencies = this.getDependencies(node);
    
    for (const dependency of dependencies) {
      if (!visited.has(dependency)) {
        this._detectCyclesFromNode(dependency, visited, recursionStack, path, cycles);
      } else if (recursionStack.has(dependency)) {
        // Found a cycle
        const cycleStart = path.indexOf(dependency);
        const cycle = path.slice(cycleStart).concat(dependency);
        cycles.push(cycle);
      }
    }

    recursionStack.delete(node);
    path.pop();
  }

  /**
   * Perform topological sort to get module loading order
   * @returns {Array<string>} Topologically sorted array of module paths
   * @throws {Error} If circular dependencies are found
   */
  topologicalSort() {
    const circularDeps = this.detectCircularDependencies();
    if (circularDeps.length > 0) {
      throw new Error(`Circular dependencies detected: ${JSON.stringify(circularDeps)}`);
    }

    const visited = new Set();
    const visiting = new Set();
    const result = [];

    // Use all modules as potential starting points
    const allModules = Array.from(this.modules.keys());
    
    for (const module of allModules) {
      if (!visited.has(module)) {
        this._topologicalSortDFS(module, visited, visiting, result);
      }
    }

    return result;
  }

  /**
   * Helper method for topological sort using DFS
   * @private
   */
  _topologicalSortDFS(node, visited, visiting, result) {
    if (visiting.has(node)) {
      // This should not happen if we've already checked for cycles
      throw new Error(`Cycle detected at node: ${node}`);
    }
    
    if (visited.has(node)) {
      return;
    }

    visiting.add(node);

    const dependencies = this.getDependencies(node);
    for (const dependency of dependencies) {
      this._topologicalSortDFS(dependency, visited, visiting, result);
    }

    visiting.delete(node);
    visited.add(node);
    result.push(node);
  }

  /**
   * Get the size of the dependency graph
   * @returns {Object} Object with counts of modules and dependencies
   */
  getSize() {
    let totalDependencies = 0;
    for (const deps of this.dependencies.values()) {
      totalDependencies += deps.length;
    }

    return {
      modules: this.modules.size,
      dependencies: totalDependencies
    };
  }

  /**
   * Check if the graph has a specific module
   * @param {string} modulePath - The module path to check
   * @returns {boolean} True if module exists in graph
   */
  hasModule(modulePath) {
    return this.modules.has(modulePath);
  }

  /**
   * Remove a module from the graph
   * @param {string} modulePath - The module path to remove
   */
  removeModule(modulePath) {
    // Remove the module itself
    this.modules.delete(modulePath);
    
    // Remove from dependencies map
    this.dependencies.delete(modulePath);
    
    // Remove from dependents map
    this.dependents.delete(modulePath);
    
    // Remove references to this module from other modules
    for (const [module, deps] of this.dependencies.entries()) {
      const index = deps.indexOf(modulePath);
      if (index !== -1) {
        deps.splice(index, 1);
      }
    }
    
    for (const [module, deps] of this.dependents.entries()) {
      const index = deps.indexOf(modulePath);
      if (index !== -1) {
        deps.splice(index, 1);
      }
    }
  }

  /**
   * Get a string representation of the graph for debugging
   * @returns {string} String representation of the graph
   */
  toString() {
    const lines = [];
    lines.push('Dependency Graph:');
    
    for (const [module, deps] of this.dependencies.entries()) {
      if (deps.length > 0) {
        lines.push(`  ${module} -> [${deps.join(', ')}]`);
      } else {
        lines.push(`  ${module} -> []`);
      }
    }
    
    return lines.join('\n');
  }
}