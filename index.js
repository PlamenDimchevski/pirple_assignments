/**
 *
 * Primary file for the APP
 */

// Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');

// Declare the APP
const app = {};

// Init function
app.init = function() {
   // Start the server
   server.init();

   // Start the workers
   workers.init();
};

// Self executing
app.init();

// Export the app
module.exports = app;
