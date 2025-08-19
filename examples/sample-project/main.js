// Sample entry point
import { utils } from './utils.js';
import { Component } from './components/component.js';
import './styles.css';

export default function main() {
  const component = new Component();
  utils.log('Application started');
  return component;
}