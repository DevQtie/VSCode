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
            await logsErrorExceptions('authenticate, message: {Unauthorized}, IP: ' + ip);
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
            .query('EXEC rpiAPSM_spAPIErrExpLogs @error_exc_logs');
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
            .query('SELECT * FROM rpiAPSM_RandomText WHERE id = @id');

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
        await request.input('random_text', sql.VarChar(50), random_text)
            .query('INSERT INTO rpiAPSM_RandomText (random_text) VALUES (@random_text)');
        res.status(201).send({ message: 'RandomText added successfully' });
    } catch (err) {
        res.status(500).send({ message: err.message });
        await logsErrorExceptions('addRandomText: ' + err.message);
    }
}//working&tested

const updateRandomText = async (req, res) => {
    const { id, random_text } = req.params;

    try {
        const pool = await poolPromise17;
        const request = pool.request();
        await request.input('id', sql.Int, id)
            .input('random_text', sql.VarChar(50), random_text)
            .query('UPDATE rpiAPSM_RandomText SET random_text = @random_text WHERE id = @id');
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
            .query('DELETE FROM rpiAPSM_RandomText WHERE id = @id');
        res.status(200).send({ message: 'RandomText deleted successfully' });
    } catch (err) {
        res.status(500).send({ message: err.message });
        await logsErrorExceptions('deleteRandomText: ' + err.message);
    }
}

const uploadMultiImageFilesWithText = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }
        const { img1_desc, img2_desc, img3_desc } = req.params;

        // Access files via req.files
        const filesInfo = req.files.map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
        }));

        res.status(200).json({
            message: 'Files uploaded successfully',
            files: filesInfo,
            desc1: img1_desc,
            desc2: img2_desc,
            desc3: img3_desc,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const uploadTestImg = async (req, res) => {
    if (!req.file) {
        return res.status(400).send('Test Image Processing is unavailable.');
    }
    const { img_f_kbsize } = req.params;

    const filePath = req.file.path;
    const img_desc = 'Test image';
    const fileBuffer = fs.readFileSync(filePath);//focus on this

    try {
        const pool = await poolPromise;
        const request = pool.request();
        await request.input('img_name', sql.NVarChar(50), path.basename(filePath))
            .input('img_desc', sql.NVarChar(200), img_desc)
            .input('img_data', sql.VarBinary(sql.MAX), fileBuffer)// focus on this, the data is reprocessed
            .input('img_f_kbsize', sql.Decimal(8, 3), img_f_kbsize)
            .query('INSERT INTO rpiAPSMI_TestImgRepo (img_name, img_desc, img_data, img_f_kbsize) VALUES (@img_name, @img_desc, @img_data, @img_f_kbsize);');

        // res.status(200).send({ message: 'Image uploaded successfully' });

        // Clean up temporary file after saving to database
        fs.unlink(filePath, async (err) => {
            if (err) {
                // console.error('Error deleting temporary file:', err);
                await logsErrorExceptions('uploadTestImg: ' + err.message);//always double check the method name
            } else {
                // console.log('Temporary file deleted successfully.');
                res.status(200).send({ message: 'Image uploaded successfully' });
            }
        });
    } catch (err) {
        res.status(500).send({ message: err.message });
        await logsErrorExceptions('uploadTestImg: ' + err.message);//always double check the method name

        // Clean up temporary file after saving to database
        fs.unlink(filePath, async (err) => {
            if (err) {
                // console.error('Error deleting temporary file:', err);
                await logsErrorExceptions('uploadTestImg: ' + err.message);//always double check the method name
            } else {
                // console.log('Temporary file deleted successfully.');
                res.status(200).send({ message: 'Image uploaded successfully' });
            }
        });
    }
}

const retrieveTestImg = async (req, res) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();
        const result = await request.query('EXEC rpiAPSMI_spRetrieveFileStreamTestData');

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
        await logsErrorExceptions('retrieveTestImg: ' + err.message);//always double check the method name
    }
}

const retrieveLLCTestImage = async (req, res) => { // lossless compression (Lss2C) - devqt's self thought acronym
    try {
        const pool = await poolPromise;
        const request = pool.request();
        const result = await request.query('EXEC rpiAPSMI_spRetrieveFileStreamTestData');

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
        await logsErrorExceptions('retrieveLLCTestImage: ' + err.message);//always double check the method name
    }
}

/* START OF OFFICIAL NODE.JS API CONTROLLER */

const manageUser = async (req, res) => { // not working due to sp's changes
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
    const fileBuffer = fs.readFileSync(filePath);//focus on this

    try {
        const pool = await poolPromise17;
        const request = pool.request();
        await request.input('img_name', sql.NVarChar(50), path.basename(filePath))
            .input('img_desc', sql.NVarChar(200), img_desc)
            .input('img_data', sql.VarBinary(sql.MAX), fileBuffer)// focus on this, the data is reprocessed
            .input('img_f_kbsize', sql.Decimal(8, 3), img_f_kbsize)
            .query('INSERT INTO rpiAPSM_KYCFrontID (img_name, img_desc, img_data, img_f_kbsize) VALUES (@img_name, @img_desc, @img_data, @img_f_kbsize);');

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
                    .png({ compressionLevel: 9, quality: 1, progressive: false }) // Adjust settings as needed for your image format 
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
        await logsErrorExceptions('retrieveLLCFrontID: ' + err.message); //always double check the method name
    }
}

const manageUserCodeRequest = async (req, res) => {
    const { email, mobile_no, device_id, code, function_key } = req.params;

    try {
        const pool = await poolPromise17;
        const request = pool.request();
        const result = await request.input('email', sql.VarChar(100), email)
            .input('mobile_no', sql.VarChar(14), mobile_no)
            .input('device_id', sql.VarChar(500), device_id)
            .input('code', sql.VarChar(10), code)
            .input('function_key', sql.VarChar(100), function_key)
            .query('EXEC rpiAPSM_spManageUserCodeRequest @email, @mobile_no, @device_id, @code, @function_key');

        if (result.recordset.length > 0) {
            // Simplify the response
            const spOutput = result.recordset[0]?.SP_OUTPUT || null;
            if (spOutput !== null) {
                res.status(200).json(spOutput);
            } else {
                res.status(200).json(result); // if I have more than one records to be retrieved, instead of just a single SP_OUTPUT
            }

        }
    } catch (err) {
        res.status(500).send({ message: err.message });
        await logsErrorExceptions('manageUserCodeRequest: ' + err.message); //always double check the method name
    }
}

const partialSignUp = async (req, res) => {
    const {
        user_id,
        device_id,
        front_id_img_data,
        front_id_img_f_kbsize,
        back_id_img_data,
        back_id_img_f_kbsize,
        selfie_img_data,
        selfie_img_f_kbsize,
        given_name,
        middle_name,
        family_name,
        suffix,
        gender,
        birthday,
        nationality,
        country,
        province,
        city_mun,
        brgy,
        unit_h_bldg_st,
        vill_sub,
        zip_code,
        source_of_fund,
        emp_status,
        employer,
        occupation,
        email_add,
        mobile_no,
        password,
        function_key
    } = req.params;

    try {
        const pool = await poolPromise17;
        const request = pool.request();
        const result = await request.input('user_id', sql.VarChar(50), user_id)
            .input('device_id', sql.NVarChar(500), device_id)
            .input('front_id_img_data', sql.VarBinary(sql.MAX), new Buffer.from(front_id_img_data))
            .input('front_id_img_f_kbsize', sql.Decimal(10, 3), front_id_img_f_kbsize)
            .input('back_id_img_data', sql.VarBinary(sql.MAX), new Buffer.from(back_id_img_data))
            .input('back_id_img_f_kbsize', sql.Decimal(10, 3), back_id_img_f_kbsize)
            .input('selfie_img_data', sql.VarBinary(sql.MAX), new Buffer.from(selfie_img_data))
            .input('selfie_img_f_kbsize', sql.Decimal(10, 3), selfie_img_f_kbsize)
            .input('given_name', sql.VarChar(100), given_name)
            .input('middle_name', sql.VarChar(100), middle_name)
            .input('family_name', sql.VarChar(100), family_name)
            .input('suffix', sql.VarChar(20), suffix)
            .input('gender', sql.VarChar(100), gender)
            .input('birthday', sql.Date, birthday)
            .input('nationality', sql.VarChar(50), nationality)
            .input('country', sql.VarChar(200), country)
            .input('province', sql.VarChar(200), province)
            .input('city_mun', sql.VarChar(200), city_mun)
            .input('brgy', sql.VarChar(200), brgy)
            .input('unit_h_bldg_st', sql.VarChar(200), unit_h_bldg_st)
            .input('vill_sub', sql.VarChar(200), vill_sub)
            .input('zip_code', sql.VarChar(4), zip_code)
            .input('source_of_fund', sql.VarChar(100), source_of_fund)
            .input('emp_status', sql.VarChar(50), emp_status)
            .input('employer', sql.VarChar(200), employer)
            .input('occupation', sql.VarChar(200), occupation)
            .input('email_add', sql.VarChar(50), email_add)
            .input('mobile_no', sql.VarChar(50), mobile_no)
            .input('password', sql.NVarChar(50), password)
            .input('function_key', sql.VarChar(100), function_key)
            .query('EXEC rpiAPSM_spManageUsersData @user_id, @device_id, @front_id_img_data, @front_id_img_f_kbsize, @back_id_img_data, @back_id_img_f_kbsize, @selfie_img_data, @selfie_img_f_kbsize, @given_name, @middle_name, @family_name, @suffix, @gender, @birthday, @nationality, @country, @province, @city_mun, @brgy, @unit_h_bldg_st, @vill_sub, @zip_code, @source_of_fund, @emp_status, @employer, @occupation, @email_add, @mobile_no, @password, @function_key');

        if (result.recordset.length > 0) {
            // Simplify the response
            const spOutput = result.recordset[0]?.SP_OUTPUT || null;
            if (spOutput !== null) {
                res.status(200).json(spOutput);
            } else {
                res.status(200).json(result); // if I have more than one records to be retrieved, instead of just a single SP_OUTPUT
            }

        } else {
            res.status(500).send({ message: err.message });
            await logsErrorExceptions('partialSignUp: ' + err.message);//always double check the method name
        }
    } catch (err) {
        res.status(500).send({ message: err.message });
        await logsErrorExceptions('partialSignUp: ' + err.message);//always double check the method name
    }
}

export {
    authenticate,
    fetchData,
    getRandomText,
    addRandomText,
    updateRandomText,
    deleteRandomText,
    uploadMultiImageFilesWithText,
    uploadTestImg,
    retrieveTestImg,
    retrieveLLCTestImage,

    manageUser,
    getPhilippineAddressName,
    uploadFrontID,
    retrieveFrontID,
    retrieveLLCFrontID,
    manageUserCodeRequest,
    partialSignUp,
};