import { test } from 'shelljs';
import path from 'path';
import { promises as fs } from 'node:fs';
import { Readable } from 'stream';
import spawnAsync from '@expo/spawn-async';
import { writeFile } from 'fs/promises';

export const downloadFileAsync = async (
  url: string | URL | Request,
  destinationDir: string,
  fileName: string,
) => {
  const response = await fetch(url);
  const body = Readable.fromWeb(response.body as any);
  await fs.writeFile(path.join(destinationDir, fileName), body, {});
};

export const removeDirectoryIfNeededAsync = async (directoryPath: string) => {
  if (test('-e', directoryPath)) {
    await fs.rm(directoryPath, { recursive: true });
  }
};

export const recreateDirectoryAsync = async (directoryPath: string) => {
  await removeDirectoryIfNeededAsync(directoryPath);
  await fs.mkdir(directoryPath, { recursive: true });
};

export const copyDirectoryAsync = async (
  sourceDirectoryPath: string,
  destDirectoryPath: string,
) => {
  await fs.cp(sourceDirectoryPath, destDirectoryPath, {
    recursive: true,
  });
};

export const copyDirectoryContentsAsync = async (
  sourceDirectoryPath: string,
  destDirectoryPath: string,
) => {
  const files = await fs.readdir(sourceDirectoryPath);
  for (const file of files) {
    await fs.cp(
      path.join(sourceDirectoryPath, file),
      path.join(destDirectoryPath, file),
      {
        recursive: true,
      },
    );
  }
};

export const unpackTarArchiveAsync = async (
  tarArchivePath: string,
  destDirectoryPath: string,
) => {
  await spawnAsync('tar', ['zxf', tarArchivePath], {
    stdio: 'inherit',
    cwd: destDirectoryPath,
  });
};

export const readFileFromPathAsync = async (filePath: string) => {
  if (test('-e', filePath)) {
    const data = (
      await fs.readFile(filePath, {
        encoding: 'utf8',
        flag: 'r',
      })
    ).trim();

    if (data.length > 0) {
      return data;
    } else {
      throw new Error(`${filePath} is empty`);
    }
  } else {
    throw new Error(`${filePath} does not exist`);
  }
};

export const rewriteFileAtPathAsync = async (
  filePath: string,
  edits: { original: string | RegExp; replacement: string }[],
) => {
  const originalText = await readFileFromPathAsync(filePath);
  let editedText = originalText;
  for (const replacement of edits) {
    editedText = editedText.replaceAll(
      replacement.original,
      replacement.replacement,
    );
  }
  await writeFile(filePath, editedText, { encoding: 'utf-8' });
};
