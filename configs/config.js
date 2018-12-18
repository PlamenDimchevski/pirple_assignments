/**
 *
 * Create and export configuration variables
 */

// Dependencies
const fs = require('fs');
const path = require('path');

// Instantiate the HTTPS server
const https_server_options = {
   'key' : fs.readFileSync('./https/key.pem'),
   'cert': fs.readFileSync('./https/cert.pem'),
};

// Determine which environment was passed as a command-line argument
const node_env = process.env.NODE_ENV;
const node_debug = process.env.NODE_DEBUG;
const current_environment = typeof( node_env ) == 'string' ? node_env.toLowerCase() : '';

// Container for all the environments
const environments = {};

// Staging (default) environment
environments.staging = {
   'http_port' : 3000,
   'https_port' : 3001,
   'node_env' : 'staging',
   'hashing_secret' : 'thisIsASecret',
   'log_compression_interval' : 1000 * 60 * 60, // Once per hour
};

// Production environment
environments.production = {
   'http_port' : 5000,
   'https_port' : 5001,
   'node_env' : 'production',
   'hashing_secret' : 'thisIsASecret',
   'log_compression_interval' : 1000 * 60 * 60 * 24, // Once per day
};

// Check that the current environment is one of the environments above, if not default to staging
const environment_to_export = typeof( environments[ current_environment ] ) == 'object' ? environments[ current_environment ] : environments.staging;

// Export the module
module.exports = {
   ...environment_to_export,
   // If we debugging the workers, regardless of the env, run the workers loop every minute
   log_compression_interval : node_debug == 'workers' ? 1000 * 60 : environment_to_export.log_compression_interval,
   https_server_options,
   base_dir : path.join(__dirname, '/../'),
   data_dir : path.join(__dirname, '/../.data/'),
   logs_dir : path.join(__dirname, '/../.logs/'),
   config_dir : path.join(__dirname, '/../.configs/'),
};
