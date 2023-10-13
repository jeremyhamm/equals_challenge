# SUMIF

## Solution Explanation
1. Parse csv file into an array of objects which is easy to work with in Javascript.
2. Parse query file and iterate one operation at a time.
3. Compile chained filters from query criteria.
4. Filter csv records by filter in step 3.
5. Sum remaining csv records for each operation.
6. Ouput result into text file.

## Running the Application Locally
1. Install [Nodejs](https://nodejs.org/en/download)
2. Install dependencies `npm install`
3. Run the application `npm run start ./sample_csv_data.csv ./sample_queries.json`
4. Run the application with included samples `npm run start:samples`
5. The output will be saved to `result.txt`

## Running the Application with Docker
1. docker-compose up
5. The output will be saved to `result.txt`
