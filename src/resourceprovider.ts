import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

// Determine the base directory (handles both src/ during dev and dist/ after build)
const baseDir = __dirname.includes('dist')
  ? path.resolve(__dirname, '../src')  // If in dist/, go back to src/
  : __dirname;  // If in src/, use current directory

export function readFile(sPath: string, relativeTo?: string): string {
  const sResourcecPath = path.resolve(relativeTo? relativeTo : baseDir, sPath);
  return fs.readFileSync(sResourcecPath, "utf8");
}