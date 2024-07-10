import { sql, poolPromise } from '../config/db.config.js';
import dotenv from 'dotenv'
import { createCipheriv, createDecipheriv } from 'crypto';

dotenv.config({ path: '.env' }); // Load environment variables

const algorithm = process.env.ALGORITHM;

const key = Buffer.from(process.env.CRYPTO_KEY, process.env.BASE_STRUCTURE); // Use a secure, pre-shared key
const iv_val = Buffer.from(process.env.CRYPTO_IV, process.env.BASE_STRUCTURE);  // Use a random IV

const API_KEY_1 = process.env.API_KEY1; // Store securely

// // Middleware to check API key
// const authenticate = (req, res, next) => {
//     const apiKey = req.headers[process.env.API_HEADER];
//     if (apiKey && apiKey === API_KEY) {
//         next();
//     } else {
//         res.status(401).json({ error: 'Unauthorized' });
//     }
// };//basic structure

const authenticate = (req, res, next) => {
    try {
        const { iv } = req.body;
        const encryptedData1 = req.headers[process.env.API_HEADER1];//for API_KEY1
        const encryptedData2_raw = req.headers[process.env.API_HEADER2];//for API_KEY2
        const API_KEY_2 = decrypt(encryptedData2_raw, iv);//Decrypt the header2
        const apiKey1 = decrypt(encryptedData1, iv);
        const apiKey2 = process.env.CRYPTO_IV;//cross-check the decrypted header2
        if (apiKey1 && apiKey1 === API_KEY_1 && API_KEY_2 && API_KEY_2 === apiKey2) {
            next();
        } else {
            res.status(401).json({ error: 'Unauthorized' });//modify the message only for testing DEFAULT: Unauthorized
        }
    } catch {
        res.status(401).send({ error: "Unauthorized" });//modify the message only for testing DEFAULT: Unauthorized
    }
};//This is working, please don't modify the structure unless necessary.

// Encryption function
const encrypt = (text) => {
    const cipher = createCipheriv(algorithm, key, iv_val);
    let encrypted = cipher.update(text, process.env.ENCODING_STRUCTURE, process.env.ENCODING);
    encrypted += cipher.final(process.env.ENCODING);
    return {
        iv_val: iv_val.toString(process.env.ENCODING),
        encryptedData: encrypted,
    };
};

// Decryption function
const decrypt = (encryptedData, ivHex) => {
    const iv = Buffer.from(ivHex, process.env.ENCODING);
    const encryptedText = Buffer.from(encryptedData, process.env.ENCODING);
    const decipher = createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, process.env.ENCODING, process.env.ENCODING_STRUCTURE);
    decrypted += decipher.final(process.env.ENCODING_STRUCTURE);
    return decrypted;
};

const logsErrorExceptions = async (err) => {
    // Convert the error object to a string representation
    const error_exc_logs = JSON.stringify(err);
    const pool = await poolPromise;
    const request = pool.request();

    try {
        await request.input('error_exc_logs', sql.VarChar(sql.MAX), error_exc_logs)
            .query('EXEC rpiAPSM_spErrExpLogs @error_exc_logs');
        //console.error('SuccessErrorLogging');//for testing purposes
    } catch (err2) {
        res.status(500).send({ message: err.message });
        // await logsErrorExceptions(err2.message);
        // console.error('UnsuccessErrorLogging');//for testing purposes
    }
}//system-level process only

// Example function to fetch data from MSSQL using stored procedure
const fetchData = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('EXEC rpiAPSM_spRandomText'); // Replace with your stored procedure name
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send({ message: err.message });
        await logsErrorExceptions('fetchData: ' + err.message);
    }
};//working&tested

const getRandomText = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM rpiAPSM_Random_Text WHERE id = @id');

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).send({ message: 'RandomText not found' });
        }
    } catch (err) {
        res.status(500).send({ message: err.message });
        await logsErrorExceptions('getRandomText: ' + err.message);
    }
}//working&tested

const addRandomText = async (req, res) => {
    const { random_text } = req.params;

    try {
        const pool = await poolPromise;
        const request = pool.request();
        await request.input('random_text', sql.VarChar, random_text)
            .query('INSERT INTO rpiAPSM_Random_Text (random_text) VALUES (@random_text)');
        res.status(201).send({ message: 'RandomText added successfully' });
    } catch (err) {
        res.status(500).send({ message: err.message });
        await logsErrorExceptions(err.message);
    }
}//working&tested

const updateRandomText = async (req, res) => {
    const { id, random_text } = req.params;

    try {
        const pool = await poolPromise;
        const request = pool.request();
        await request.input('id', sql.Int, id)
            .input('random_text', sql.VarChar, random_text)
            .query('UPDATE rpiAPSM_Random_Text SET random_text = @random_text WHERE id = @id');
        res.status(200).send({ message: 'RandomText updated successfully' });
    } catch (err) {
        res.status(500).send({ message: err.message });
        await logsErrorExceptions('updateRandomText: ' + err.message);
    }
}//working&tested

const deleteRandomText = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        const request = pool.request();
        await request.input('id', sql.Int, id)
            .query('DELETE FROM rpiAPSM_Random_Text WHERE id = @id');
        res.status(200).send({ message: 'RandomText deleted successfully' });
    } catch (err) {
        res.status(500).send({ message: err.message });
        await logsErrorExceptions('deleteRandomText: ' + err.message);
    }
}

export {
    authenticate,
    fetchData,
    getRandomText,
    addRandomText,
    updateRandomText,
    deleteRandomText
};