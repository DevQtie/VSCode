import { sql, poolPromise, poolPromise17 } from '../config/db.config.js';
import dotenv from 'dotenv'
import { createCipheriv, createDecipheriv } from 'crypto';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

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

const authenticate = async (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
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
            await logsErrorExceptions('Requestor_s IP: ' + ip);
        }
    } catch (err) {
        res.status(401).send({ error: "Unauthorized" });//modify the message only for testing DEFAULT: Unauthorized
        await logsErrorExceptions('authenticate: ' + err.message + '. IP: ' + ip);
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
    const pool = await poolPromise17;
    const request = pool.request();

    try {
        await request.input('error_exc_logs', sql.NVarChar(sql.MAX), error_exc_logs)
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
        const pool = await poolPromise17;
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
        const pool = await poolPromise17;
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
        const pool = await poolPromise17;
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
        const pool = await poolPromise17;
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
        const pool = await poolPromise17;
        const request = pool.request();
        await request.input('id', sql.Int, id)
            .query('DELETE FROM rpiAPSM_Random_Text WHERE id = @id');
        res.status(200).send({ message: 'RandomText deleted successfully' });
    } catch (err) {
        res.status(500).send({ message: err.message });
        await logsErrorExceptions('deleteRandomText: ' + err.message);
    }
}

/* START OF OFFICIAL NODE.JS API CONTROLLER */

const manageUser = async (req, res) => {
    const { mobile_no, password, function_key } = req.params;

    try {
        const pool = await poolPromise17;
        const result = await pool.request()
            .input('mobile_no', sql.NVarChar(50), mobile_no)
            .input('password', sql.NVarChar(50), password)
            .input('function_key', sql.VarChar(100), function_key)
            .query('EXEC rpiAPSM_spManageUsersData @mobile_no, @password, @function_key');

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).send({ message: 'Configuration Exception.' });
        }
    } catch (err) {
        res.status(500).send({ message: err.message });
        await logsErrorExceptions('manageUser: ' + err.message);//always double check the method name
    }
}

const getPhilippineAddressName = async (req, res) => {
    const { type, name } = req.params;

    try {
        const pool = await poolPromise17;
        const result = await pool.request()
            .input('type', sql.NVarChar(50), type)
            .input('name', sql.NVarChar(50), name)
            .query('EXEC rpiAPSM_spPhilippineLocation @type, @name');

        res.json(result.recordset);
    } catch (err) {
        res.status(500).send({ message: err.message });
        await logsErrorExceptions('getPhilippineAddressName: ' + err.message);//always double check the method name
    }
}

const uploadFrontID = async (req, res) => {
    if (!req.file) {
        return res.status(400).send('KYC Processing is unavailable.');
    }
    const { img_f_kbsize } = req.params;

    const filePath = req.file.path;
    const img_desc = 'Front ID image';
    const img_repo = 'C:/CustomFileStreamDataRepository';
    // const filePathFinal = img_repo + '/' + filePath;
    const fileBuffer = fs.readFileSync(filePath);//focus on this

    try {
        const pool = await poolPromise17;
        const request = pool.request();
        await request.input('img_name', sql.NVarChar(50), path.basename(filePath))
            .input('img_desc', sql.NVarChar(200), img_desc)
            .input('img_data', sql.VarBinary(sql.MAX), fileBuffer)// focus on this, the data is reprocessed
            .input('img_repo', sql.NVarChar(256), img_repo)
            .input('img_f_kbsize', sql.Decimal(8, 3), img_f_kbsize)
            .query('INSERT INTO rpiAPSM_KYCFrontID (img_name, img_desc, img_data, img_repo, img_f_kbsize) VALUES (@img_name, @img_desc, @img_data, @img_repo, @img_f_kbsize);');

        // res.status(200).send({ message: 'Image uploaded successfully' });

        // Clean up temporary file after saving to database
        fs.unlink(filePath, async (err) => {
            if (err) {
                // console.error('Error deleting temporary file:', err);
                await logsErrorExceptions('uploadFrontID: ' + err.message);//always double check the method name
            } else {
                // console.log('Temporary file deleted successfully.');
                res.status(200).send({ message: 'Image uploaded successfully' });
            }
        });
    } catch (err) {
        res.status(500).send({ message: err.message });
        await logsErrorExceptions('uploadFrontID: ' + err.message);//always double check the method name
    }
}

const retrieveFrontID = async (req, res) => {
    try {
        const pool = await poolPromise17;
        const request = pool.request();
        const result = await request.query('EXEC rpiAPSM_spRetrieveFileStreamData');

        if (result.recordset.length > 0) {
            const files = result.recordset;

            // Option 1: Return the list of files as a JSON response with Base64 encoded file data
            const fileList = files.map(file => ({
                img_name: file.img_name,
                dt_stamp: file.dt_stamp,
                img_data: file.img_data.toString('base64'), // Convert binary data to base64 for transport in JSON
                file_size: file.file_size
            }));

            res.status(200).json(fileList);

            // Option 2: If you want to handle them as downloads, you'd need to implement it differently.
            // Since sending multiple files in a single response isn't straightforward, you could:
            //   - Return file links to be downloaded one-by-one
            //   - Package the files into a ZIP or similar archive
        } else {
            res.status(404).json({ message: 'No files found' });
        }
    } catch (err) {
        res.status(500).send({ message: err.message });
        await logsErrorExceptions('retrieveFrontID: ' + err.message);//always double check the method name
    }
}

// Assuming files is an array of file objects with binary img_data
const fileList = async function (files) {
    return await Promise.all(
        files.map(async (file) => {
            try {
                // Compress the image data using sharp
                const compressedImageBuffer = await sharp(file.img_data)
                    .png({ compressionLevel: 9, quality: 5 }) // Adjust settings as needed for your image format, I've set to max 9
                    .toBuffer();

                // Convert the compressed binary data to base64
                const compressedBase64 = compressedImageBuffer.toString('base64');

                return {
                    img_name: file.img_name,
                    dt_stamp: file.dt_stamp,
                    img_data: compressedBase64, // Use the compressed base64 data
                    file_size: compressedImageBuffer.length // Update file size after compression
                };
            } catch (error) {
                console.error(`Error compressing image ${file.img_name}:`, error);
                return {
                    img_name: file.img_name,
                    dt_stamp: file.dt_stamp,
                    img_data: null, // Or handle the error accordingly
                    file_size: file.file_size // Keep original size or set to null
                };
            }
        })
    );
};


const retrieveLLCFrontID = async (req, res) => { // lossless compression (Lss2C) - devqt's self thought acronym
    try {
        const pool = await poolPromise17;
        const request = pool.request();
        const result = await request.query('EXEC rpiAPSM_spRetrieveFileStreamData');

        if (result.recordset.length > 0) {
            const files = result.recordset;

            // Option 1: Return the list of files as a JSON response with Base64 encoded file data
            // const fileList = files.map(file => ({
            //     img_name: file.img_name,
            //     dt_stamp: file.dt_stamp,
            //     img_data: file.img_data.toString('base64'), // Convert binary data to base64 for transport in JSON
            //     file_size: file.file_size
            // }));


            // Await the processing of all files before sending the response
            const processedFiles = await fileList(files);

            res.status(200).json(processedFiles);

            // Option 2: If you want to handle them as downloads, you'd need to implement it differently.
            // Since sending multiple files in a single response isn't straightforward, you could:
            //   - Return file links to be downloaded one-by-one
            //   - Package the files into a ZIP or similar archive
        } else {
            res.status(404).json({ message: 'No files found' });
        }
    } catch (err) {
        res.status(500).send({ message: err.message });
        await logsErrorExceptions('retrieveFrontID: ' + err.message);//always double check the method name
    }
}

export {
    authenticate,
    fetchData,
    getRandomText,
    addRandomText,
    updateRandomText,
    deleteRandomText,

    manageUser,
    getPhilippineAddressName,
    uploadFrontID,
    retrieveFrontID,
    retrieveLLCFrontID,
};