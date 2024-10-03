import dotenv from 'dotenv'
dotenv.config({ path: '.env' }); // Load environment variables

import sql from 'mssql';
import tls from 'tls';

tls.DEFAULT_MIN_VERSION = 'TLSv1.2';

/* IMPORTANT NOTES: YOU CAN ADD ANOTHER CONFIG AND DATABASE SOURCE TRANSMISSION BASED ON API REQUEST

    COMPREHENSIVE OVERVIEW:

    * You can create a function in api.controller.js that uses a different config,
    it serves as a switching point from which the requests are used for (e.g., test requests between live requests).

    * There will be an another poolPromise for the controller to be used later for another database transmission.

    * The router setup in api.router.js will also be adjusted for this matter. 

*/

const isEncrypt = (process.env.MSSQL_ENCRYPT === 'true'); // Evaluates to true
const trustServerCert = (process.env.MSSQL_TRUSTSERVERCERT === 'true'); // Evaluates to true
const portValue = process.env.MSSQL_PORT;
const portValue17 = process.env.MSSQL_PORT17;
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
        cryptoCredentialsDetails: {
            minVersion: tls.DEFAULT_MIN_VERSION
        }
    },
    pool: {
        max: parseInt(poolMax), // Maximum number of connections in the pool
        min: parseInt(poolMin), // Minimum number of connections in the pool
        idleTimeoutMillis: parseInt(idleTOMilliValue), // Time in milliseconds before an idle connection is closed
    },
};

// Configuration for MSSQL connection
const config17 = {
    user: process.env.MSSQL_USERNAME,
    password: process.env.MSSQL_PASSWORD17,
    server: process.env.MSSQL_SERVER17,
    database: process.env.MSSQL_DATABASE,
    options: {
        encrypt: isEncrypt, // Enable encryption
        trustServerCertificate: trustServerCert, // Allow self-signed certificates
        port: parseInt(portValue17),
        cryptoCredentialsDetails: {
            minVersion: tls.DEFAULT_MIN_VERSION
        }
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

const poolPromise17 = new sql.ConnectionPool(config17)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed!', err);
        process.exit(1);
    });

export { sql, poolPromise, poolPromise17 };