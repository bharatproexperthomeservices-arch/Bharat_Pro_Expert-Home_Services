import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const roots = ['server.js', 'js', 'api'];
const jsFiles = [];

for (const root of roots) {
  if (fs.existsSync(root)) {
    const stat = fs.statSync(root);
    if (stat.isFile() && root.endsWith('.js')) {
      jsFiles.push(root);
    } else if (stat.isDirectory()) {
      const entries = fs.readdirSync(root);
      for (const entry of entries) {
        if (entry.endsWith('.js')) {
          jsFiles.push(path.join(root, entry));
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
