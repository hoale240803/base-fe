import { promises as fs } from 'fs';
import path from 'path';

/**
 * Module Resolver - Resolves module paths according to Node.js resolution algorithm
 */
export class ModuleResolver {
  constructor(options = {}) {
    this.extensions = options.extensions || ['.js', '.mjs', '.ts'];
    this.baseDir = options.baseDir || process.cwd();
  }

  /**
   * Resolve a module path from a given context
   * @param {string} modulePath - The module path to resolve
   * @param {string} fromPath - The path of the file doing the import
   * @returns {Promise<string>} The resolved absolute path
   */
  async resolve(modulePath, fromPath) {
    // Handle relative paths
    if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
      return this.resolveRelative(modulePath, fromPath);
    }
    
    // Handle absolute paths
    if (path.isAbsolute(modulePath)) {
      return this.resolveAbsolute(modulePath);
    }
    
    // Handle node_modules resolution (for npm packages)
    return this.resolveNodeModules(modulePath, fromPath);
  }

  /**
   * Resolve relative module paths
   * @param {string} modulePath - The relative module path
   * @param {string} fromPath - The path of the importing file
   * @returns {Promise<string>} The resolved absolute path
   */
  async resolveRelative(modulePath, fromPath) {
    const fromDir = path.dirname(fromPath);
    const targetPath = path.resolve(fromDir, modulePath);
    
    return this.resolveFile(targetPath);
  }

  /**
   * Resolve absolute module paths
   * @param {string} modulePath - The absolute module path
   * @returns {Promise<string>} The resolved absolute path
   */
  async resolveAbsolute(modulePath) {
    return this.resolveFile(modulePath);
  }

  /**
   * Resolve node_modules paths (simplified version)
   * @param {string} modulePath - The module name
   * @param {string} fromPath - The path of the importing file
   * @returns {Promise<string>} The resolved absolute path
   */
  async resolveNodeModules(modulePath, fromPath) {
    let currentDir = path.dirname(fromPath);
    
    while (currentDir !== path.dirname(currentDir)) {
      const nodeModulesPath = path.join(currentDir, 'node_modules', modulePath);
      
      try {
        const resolved = await this.resolveFile(nodeModulesPath);
        return resolved;
      } catch (error) {
        // Continue searching in parent directories
        currentDir = path.dirname(currentDir);
      }
    }
    
    throw new Error(`Module not found: ${modulePath}`);
  }

  /**
   * Resolve a file path with extension handling and directory index files
   * @param {string} filePath - The file path to resolve
   * @returns {Promise<string>} The resolved file path
   */
  async resolveFile(filePath) {
    // Check if file exists as-is
    if (await this.fileExists(filePath)) {
      return filePath;
    }

    // Try with extensions
    for (const ext of this.extensions) {
      const pathWithExt = filePath + ext;
      if (await this.fileExists(pathWithExt)) {
        return pathWithExt;
      }
    }

    // Check if it's a directory with index file
    if (await this.isDirectory(filePath)) {
      for (const ext of this.extensions) {
        const indexPath = path.join(filePath, `index${ext}`);
        if (await this.fileExists(indexPath)) {
          return indexPath;
        }
      }
    }

    // Check package.json main field for directories
    if (await this.isDirectory(filePath)) {
      const packageJsonPath = path.join(filePath, 'package.json');
      if (await this.fileExists(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
          if (packageJson.main) {
            const mainPath = path.resolve(filePath, packageJson.main);
            return this.resolveFile(mainPath);
          }
        } catch (error) {
          // Ignore package.json parse errors
        }
      }
    }

    throw new Error(`File not found: ${filePath}`);
  }

  /**
   * Check if a file exists
   * @param {string} filePath - The file path to check
   * @returns {Promise<boolean>} True if file exists
   */
  async fileExists(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a path is a directory
   * @param {string} dirPath - The directory path to check
   * @returns {Promise<boolean>} True if path is a directory
   */
  async isDirectory(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the relative path from base directory
   * @param {string} filePath - The absolute file path
   * @returns {string} The relative path from base directory
   */
  getRelativePath(filePath) {
    return path.relative(this.baseDir, filePath);
  }

  /**
   * Normalize a file path
   * @param {string} filePath - The file path to normalize
   * @returns {string} The normalized path
   */
  normalizePath(filePath) {
    return path.normalize(filePath);
  }
}