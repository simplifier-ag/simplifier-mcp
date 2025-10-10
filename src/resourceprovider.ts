import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url)); // get the source directory

export function readFile(sPath: string, relativeTo?: string): string {
  const sResourcecPath = path.resolve(relativeTo? relativeTo : __dirname, sPath);
  return fs.readFileSync(sResourcecPath, "utf8");
}