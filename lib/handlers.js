/**
 *
 * Request Handlers
 */

// Dependencies
const users = require('./users');
const tokens = require('./tokens');
const checks = require('./checks');

// Define the handlers
var handlers = {};

handlers.users = function( data, callback ) {
   if ( ['post', 'get', 'put', 'delete'].includes(data.method) ) {
      return users[data.method]( data, callback );
   }

   callback(405);
};

handlers.tokens = function( data, callback ) {
   if ( ['post', 'get', 'put', 'delete'].includes(data.method) ) {
      return tokens[data.method]( data, callback );
   }

   callback(405);
};

handlers.checks = function( data, callback ) {
   if ( ['post', 'get', 'put', 'delete'].includes(data.method) ) {
      return checks[data.method]( data, callback );
   }

   callback(405);
};

// Ping handler
handlers.ping = function( data, callback ) {
   callback( 200 );
};

// Not found handler
handlers.notFound = function( data, callback ) {
   callback( 404 );
};

module.exports = handlers;
