/**
 *
 * Worker-related tasks
 */

// Dependencies
const config = require('./../configs/config');
const logger = require('./data/logger')( 'workers' );

// Instantiate the workers object
const workers = {};

/**
 * Call the log compression based on a specified time period
 *
 * @method logRotationLoop
 * @private
 *
 * @return {void}
 */
workers.logRotationLoop = function() {
   setInterval( logger.compressActiveLogs, config.log_compression_interval );
};

/**
 *
 * @method init
 * @private
 *
 * @return {void}
 */
workers.init = function() {
   // Inform when the logger are called when debug them
   logger.debug(`\x1b[33mBackground workers are running\x1b[0m`);

   // Call the compression loop so checks will execute later on
   workers.logRotationLoop();
};

// Export the module
module.exports = workers;
