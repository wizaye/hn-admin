import fs from 'fs';
import path from 'path';

export function getLogoBuffer(): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'public', 'hn_quotation_logo.jpeg'));
  } catch {
    return null;
  }
}

export function getTextBuffer(): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'public', 'hn_quotation_text.jpeg'));
  } catch {
    return null;
  }
}
