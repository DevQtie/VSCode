import { sql, poolPromise } from '../config/db.config.js';

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
}

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
    fetchData,
    getRandomText,
    addRandomText,
    updateRandomText,
    deleteRandomText
};