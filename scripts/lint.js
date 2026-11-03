import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const roots = ['server.js', 'js', 'api', 'admin', 'public/admin'];
const jsFiles = [];

for (const root of roots) {
  if (fs.existsSync(root)) {
    const stat = fs.statSync(root);
    if (stat.isFile() && root.endsWith('.js')) {
      jsFiles.push(root);
    } else if (stat.isDirectory()) {
      const entries = fs.readdirSync(root, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.js')) jsFiles.push(path.join(root, entry.name));
        if (entry.isDirectory()) {
          for (const nested of fs.readdirSync(path.join(root, entry.name), { withFileTypes: true })) {
            if (nested.isFile() && nested.name.endsWith('.js')) jsFiles.push(path.join(root, entry.name, nested.name));
          }
        }
      }
    }
  }
}

console.log(`Checking syntax and lint for ${jsFiles.length} JavaScript files...`);

for (const file of jsFiles) {
  try {
    execSync(`node --check "${file}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Lint check failed for file: ${file}`);
    process.exit(1);
  }
}

console.log('✅ All JavaScript files passed syntax and lint checks.');
