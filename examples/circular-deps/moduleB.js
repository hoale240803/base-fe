// Module B - depends on A (creates circular dependency)
import { functionA } from './moduleA.js';

export function functionB() {
  console.log('Function B calling A');
  return functionA();
}

export default functionB;