const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const rootDir = __dirname;
const appletsDir = path.join(rootDir, '../applets');
const mainDistDir = path.join(rootDir, '../dist/applets');

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  let entries = await fs.readdir(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    entry.isDirectory()
      ? await copyDir(srcPath, destPath)
      : await fs.copyFile(srcPath, destPath);
  }
}

async function processApplet(dir) {
  const appletPath = path.join(appletsDir, dir);
  console.log(`Building ${dir}...`);

  try {
    const { stdout, stderr } = await execAsync('npm run build', {
      cwd: appletPath,
    });
    console.log(`${dir} build output:`, stdout);
    if (stderr) console.error(`${dir} build errors:`, stderr);

    const srcDistPath = path.join(appletPath, 'dist');
    const destDistPath = path.join(mainDistDir, `${dir}.applet`);

    await copyDir(srcDistPath, destDistPath);
    console.log(`Copied dist contents for ${dir} to ${destDistPath}`);
  } catch (error) {
    console.error(`Error processing ${dir}:`, error);
  }
}

async function main() {
  try {
    const directories = await fs.readdir(appletsDir);

    for (const dir of directories) {
      const stats = await fs.stat(path.join(appletsDir, dir));
      if (stats.isDirectory()) {
        await processApplet(dir);
      }
    }
  } catch (err) {
    console.error('Error processing applets:', err);
  }
}

main();
