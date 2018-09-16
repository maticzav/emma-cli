import terminal from 'term-size';
import { promisify } from 'util';
import fs from 'fs';
import childProcess from 'child_process';
import dot from 'dot-prop';

// Terminal

export const maxCellSize = () => terminal().columns / 4;

// Yarn

const canAccessFile = promisify(fs.access);
const exec = promisify(childProcess.exec);

const isYarnInstalled = async () => {
  try {
    await exec(`yarnpkg --version`, { stdio: `ignore` });
    return true;
  } catch (err) {
    return false;
  }
};

export const shouldUseYarn = async () => {
  try {
    await canAccessFile('package-lock.json');
    return false;
  } catch (err) {
    return isYarnInstalled();
  }
};

// Additional

export const notEmpty = x => x.length !== 0;

export const isEmpty = x => x.length === 0;

const getCellPadding = (pkgs, pkg) => attr => {
  const cells = pkgs.map(_pkg => dot.get(_pkg, attr));

  const cellWidth = Math.max(...cells.map(cell => (cell ? cell.length : 0)));

  const cellValueWidth =
    dot.get(pkg, attr) === null ? 0 : dot.get(pkg, attr).length;
  const width = cellWidth - cellValueWidth;

  return ` `.repeat(width);
};

export const hitsToCells = hits =>
  hits.map(hit => ({
    ...hit,
    _cell: getCellPadding(hits, hit)
  }));
