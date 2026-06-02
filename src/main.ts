import { createApp } from './app/createApp';
import './styles/global.css';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('App root not found.');
}

createApp(root);
