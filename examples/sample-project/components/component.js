// Component class
import { helper } from '../utils.js';

export class Component {
  constructor() {
    this.name = 'Sample Component';
    this.helper = helper();
  }
  
  render() {
    return `<div>${this.name}: ${this.helper}</div>`;
  }
}

export default Component;