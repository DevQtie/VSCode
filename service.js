import { Service } from 'node-windows';

const svc = new Service({
    name: 'apsalesmobileapi',
    description: 'Node application as Windows Service',
    script: 'C:\\Users\\alagu\\Desktop\\AlberthsFiles\\ECommerce\\backend-api\\server.js'
});
svc.on('install', () => svc.start());
svc.install();

/*-- To run this service.js --*/

//install in this directory the node-windows

//Open terminal

//run this code: npm install node-windows

//then run the script which will be installed as Windows Service: node service.js

// Verify the Service Installation:

// Open the Services management console. You can do this by pressing Win + R, typing services.msc, and pressing Enter.

// Look for the service name you defined in the list.

// The service should be installed and running.

