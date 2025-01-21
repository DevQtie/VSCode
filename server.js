/** IMPORTANT NOTES **/


/** open the terminal here in VS Code **/

/** execute this command: node (javascript_class).js or server.js **/

/** if it doesn't run expectedly, execute this commands where your package.json and node.js application resides:
 *
 * fnm env --use-on-cd | Out-String | Invoke-Expression **/

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';

import dotenv from 'dotenv'
import apiRoutes from './routes/api.routes.js';

dotenv.config({ path: '.env' }); // Load environment variables

const port = process.env.PORT || 430;

const server = express();

server.use(helmet());//this can be customized

const allowedOrigins = [process.env.ALLOWED_REQUEST_ORIGIN,
process.env.ALLOWED_REQUEST_ORIGIN2,
process.env.ALLOWED_REQUEST_ORIGIN3,
process.env.ALLOWED_REQUEST_ORIGIN4];

// CORS middleware
// server.use(cors({
//     origin: process.env.ALLOWED_REQUEST_ORIGIN, //origin: '*', //to accept any origin requestors but not recommended for production
//     optionsSuccessStatus: 204,
// }));

// CORS middleware
// server.use(cors({
//     origin: '*', //to accept any origin requestors but not recommended for production
//     optionsSuccessStatus: 204,
// }));

server.use(cors({
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 204
})); // multiple access origin //recommended

// Body parser middleware
server.use(bodyParser.json()); // Add middleware to parse JSON
server.use(bodyParser.urlencoded({ extended: true }));

server.use('/api', apiRoutes);

// Start the server
server.listen(port, () => {
    console.log(`Server running at ${process.env.HOST_URL + ':' + parseInt(port)}`);//NOTE: Kapag may issue sa execution, may suggestions minsan sa terminal na solutions.
});/*This is a working straighforward backenda API structure integration*/
