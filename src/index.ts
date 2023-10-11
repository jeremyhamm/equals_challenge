import fs from 'fs';
import { parse } from 'csv-parse/sync';
import readline from 'readline';

interface ICriteria {
  column: string;
  value: string;
  operator: string;
}

interface IOperation {
  name: string;
  sum_column: string;
  criteria: Array<ICriteria>;
  expected_result: number;
}

interface IRecord {
  A: string;
  B: string;
  C: string;
  D: string;
  E: string;
  F: string;
  G: string;
}

/** 
 * Parse and normalize csv
 */
const parseCSV = (file: string): Array<IRecord> => {
  try {
    const data = fs.readFileSync(file, 'utf8');
    
    // Normalize csv columns to query expectation
    return parse(data, {
      columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    });
  } catch (err) {
    console.error(err);
    process.exit(9);
  }
}

/** 
 * Parse queries from JSONL input 
 */
const parseQuery = (file: string): readline.Interface => {
  return readline.createInterface({
    input: fs.createReadStream(file),
    crlfDelay: Infinity
  });
}

/** 
 * Generate dynamic filters from query criteria
 */
const generateFiltersFromCriteria = (operation: IOperation): Array<Function> => {
  const operations = {
    "=": (a, b) => a == b,
    ">": (a, b) => a > b,
    "<": (a, b) => a < b
  };
  const filters = [];
  for (const criteria of operation.criteria) {
    filters.push((record) => operations[criteria.operator](record[criteria.column], criteria.value));
  }
  return filters;
}

/** 
 * Create results text file and append totals
 */
const processOutputFile = (filename: string, queryResult: number): void => {
  fs.appendFile(`./${filename}`, queryResult.toString() + '\n', 'utf-8', err => {
    if (err) {
      console.error(err);
    }
  });
}

/**
 * Compute SUMIFS 
 */
if (process.argv.length < 4) {
  console.error('This program requires two arguments `csv filepath` and `queries filepath`');
  process.exit(9);
}

if (typeof process.argv[2] != 'string' || typeof process.argv[3] != 'string') {
  console.error('Both arguments `csv filepath` and `queries filepath` must be strings');
  process.exit(9);
}

const outputFileName = 'result.txt'; // TODO: Potentially make this a third argument so user can specify output filename
const csvFilePath = process.argv[2];
const queryFilepath = process.argv[3];
const csvRecords = parseCSV(csvFilePath);
const operationsQueue = parseQuery(queryFilepath);
operationsQueue.on('line', (line) => {
  const operation: IOperation = JSON.parse(line);
  const filters = generateFiltersFromCriteria(operation);

  // Filter records by query
  const filterdRecords = csvRecords.filter((record) => {
    let shouldInclude = true;
    filters.forEach((filterFunction) => {
      if (!filterFunction(record)) {
        shouldInclude = false;
      }
    });
    return shouldInclude;
  });

  // Sum fitlered records
  let total = 0;
  for (const record of filterdRecords) {
    total += parseInt(record[operation.sum_column]);
  }

  // Check total against query expectation
  if (operation.expected_result != total) {
    console.error(`Invalid total for ${operation.name}`);
    process.exit(1);
  }
  
  processOutputFile(outputFileName, total);
  console.info(`Successfully processed ${operation.name}, output appended to ${outputFileName}`);
});

// Invalid query file path
operationsQueue.on('error', (error) => {
  console.error(error);
  process.exit(9);
});
