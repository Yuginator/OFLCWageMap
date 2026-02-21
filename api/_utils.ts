import fs from 'fs';
import path from 'path';
import { parse as parseSync } from 'csv-parse/sync';
import { parse as streamParse } from 'csv-parse';

const DATA_DIR = path.join(process.cwd(), 'data');
const COUNTY_REF_PATH = path.join(DATA_DIR, 'national_county.txt');

/**
 * Reads a small CSV fully into memory
 */
export function readCsvSync(fileName: string): any[] {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File ${fileName} not found in ${DATA_DIR}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseSync(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

/**
 * Streams a large CSV and filters rows by SOC code
 */
export function streamWagesBySoc(fileName: string, targetSoc: string): Promise<any[]> {
  const filePath = path.join(DATA_DIR, fileName);
  
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File ${fileName} not found in ${DATA_DIR}`));
    }
    
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(streamParse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }))
      .on('data', (row: any) => {
        const rowSoc = row.SocCode || row.SOC_CODE;
        if (rowSoc === targetSoc) {
          results.push(row);
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

/**
 * Loads the FIPS mapping data
 */
export function loadFipsMapping(): Map<string, string> {
  const content = fs.readFileSync(COUNTY_REF_PATH, 'utf-8');
  const lines = content.split('\n');
  const mapping = new Map<string, string>(); // "STATE_ABBR|COUNTY_NAME" -> FIPS

  // Format: ST,StateFIPS,CountyFIPS,CountyName,FIPSClass
  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length >= 4) {
      const stateAbbr = parts[0].trim();
      const stateFips = parts[1].trim();
      const countyFips = parts[2].trim();
      const countyName = parts[3].trim().toLowerCase();
      const fullFips = stateFips + countyFips;
      mapping.set(`${stateAbbr}|${countyName}`, fullFips);
    }
  }

  return mapping;
}
