// Module A - depends on B
import { functionB } from './moduleB.js';

export function functionA() {
  console.log('Function A calling B');
  return functionB();
}

export default functionA;