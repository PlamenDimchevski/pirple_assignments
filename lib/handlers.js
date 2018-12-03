/**
 *
 * Request Handlers
 */

// Dependencies
const users = require('./users');
const tokens = require('./tokens');

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


/**
 * "Homework Assignment #1"
 * 
 * If passed the 'name' as query parameter, or JSON with key 'name' to the body/payload, the message will be personalized.
 * The priority will be the JSON passed as payload.
 *
 * @example
 *    Examples for personalized message
 *    * query
 *       localhost:3000/hello?name=Plamen
 *    * body 
 *       {"name" : "Plamen"}
 *
 * @method hello
 * @private
 *
 * @param  {Object}   data     all data received to the server
 * @param  {Function} callback
 *
 * @return {void}
 */
handlers.hello = function( data, callback ) {
   // Test if 'name' key is present in the query object
   let message = 'World';
   message = typeof(data.query.name) === 'string' ? data.query.name : message;
   message = typeof(data.payload.name) === 'string' ? data.query.name : message;

   callback( 200, {message : `Hello ${message}!`} );
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
