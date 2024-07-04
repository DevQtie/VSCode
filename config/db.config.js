import dotenv from 'dotenv'
dotenv.config({ path: '.env' }); // Load environment variables

import sql from 'mssql';
import tls from 'tls';

tls.DEFAULT_MIN_VERSION = 'TLSv1.2';

const isEncrypt = (process.env.MSSQL_ENCRYPT === 'true'); // Evaluates to true
const trustServerCert = (process.env.MSSQL_TRUSTSERVERCERT === 'true'); // Evaluates to true
const portValue = process.env.MSSQL_PORT;
const poolMax = process.env.MSSQL_POOLMAX;
const poolMin = process.env.MSSQL_POOLMIN;
const idleTOMilliValue = process.env.MSSQL_IDLETIMEOUTMILLIS;

// Configuration for MSSQL connection
const config = {
    user: process.env.MSSQL_USERNAME,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
    options: {
        encrypt: isEncrypt, // Enable encryption
        trustServerCertificate: trustServerCert, // Allow self-signed certificates
        port: parseInt(portValue),
    },
    pool: {
        max: parseInt(poolMax), // Maximum number of connections in the pool
        min: parseInt(poolMin), // Minimum number of connections in the pool
        idleTimeoutMillis: parseInt(idleTOMilliValue), // Time in milliseconds before an idle connection is closed
    },
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed!', err);
        process.exit(1);
    });

export { sql, poolPromise };