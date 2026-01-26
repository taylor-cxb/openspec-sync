import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import extract from 'extract-zip';

/**
 * Create a zip file from a directory, preserving the folder name
 */
export async function zipDirectory(sourceDir: string, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    // Use the folder name as the base path in the zip
    const folderName = path.basename(sourceDir);
    archive.directory(sourceDir, folderName);
    archive.finalize();
  });
}

/**
 * Extract a zip file to a directory
 */
export async function unzipToDirectory(zipPath: string, destDir: string): Promise<void> {
  // Ensure destination directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  await extract(zipPath, { dir: destDir });
}

/**
 * Create a temporary file path for zip operations
 */
export function getTempZipPath(): string {
  const tmpDir = process.env.TMPDIR || process.env.TMP || '/tmp';
  return path.join(tmpDir, `openspec-${Date.now()}.zip`);
}

/**
 * Clean up a temporary file
 */
export function cleanupTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup errors
  }
}
