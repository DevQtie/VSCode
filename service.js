import { Service } from 'node-windows';
import { createRequire } from 'module';


const require = createRequire(import.meta.url);
const packageJson = require('./package.json');

const appVersion = packageJson.version;

/*
import { Service } from 'node-windows';

const svc = new Service({
    name: 'apsalesmobileapi',
    description: 'Node application as Windows Service',
    script: 'C:\\Users\\alagu\\Desktop\\AlberthsFiles\\ECommerce\\backend-api\\server.js'
});
svc.on('install', () => svc.start());
svc.install();
*/ // uncomment to test (install) it locally on your device

/* NO NEED TO MODIFY THIS AS LONG AS YOU RENAME YOUR API'S PARENT FOLDER WITH THIS INSTANCE PATTERN */

const svc = new Service({
    name: `apsalesmobileapi_v${appVersion}`,
    description: 'Node application as Windows Service',
    script: `C:\\Users\\Administrator\\API\\VSCode_v${appVersion}\\VSCode\\server.js`
});
svc.on('install', () => svc.start());
svc.install(); // to install on server side device

/*-- To run this service.js --*/

//install in this directory the node-windows

//Open terminal

//run this code: npm install node-windows

//then run the script which will be installed as Windows Service: node service.js

// Verify the Service Installation:

// Open the Services management console. You can do this by pressing Win + R, typing services.msc, and pressing Enter.

// Look for the service name you defined in the list.

// The service should be installed and running.

