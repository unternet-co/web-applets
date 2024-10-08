import fs from 'fs-extra';

export async function isAppletFolder(path: string) {
  const stats = await fs.stat(path);
  const suffix = path.split('.')[path.split('.').length - 1];
  return suffix === 'applet' && stats.isDirectory();
}
