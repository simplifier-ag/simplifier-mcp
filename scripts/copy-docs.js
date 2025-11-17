#!/usr/bin/env node
import { readdir, copyFile, mkdir } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Recursively find all .md files in a directory
 */
async function findMarkdownFiles(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await findMarkdownFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Copy markdown files from src to dist, maintaining directory structure
 */
async function copyDocs() {
  const srcDir = join(projectRoot, 'src');
  const distDir = join(projectRoot, 'dist');

  try {
    const markdownFiles = await findMarkdownFiles(srcDir);

    for (const srcFile of markdownFiles) {
      // Get relative path from src directory
      const relativePath = relative(srcDir, srcFile);
      const destFile = join(distDir, relativePath);
      const destDir = dirname(destFile);

      // Create destination directory if it doesn't exist
      await mkdir(destDir, { recursive: true });

      // Copy the file
      await copyFile(srcFile, destFile);
      console.log(`Copied: ${relativePath}`);
    }

    console.log(`✓ Copied ${markdownFiles.length} markdown file(s)`);
  } catch (error) {
    console.error('Error copying docs:', error);
    process.exit(1);
  }
}

copyDocs();
