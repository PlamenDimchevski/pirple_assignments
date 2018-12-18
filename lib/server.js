/**
 *
 * Server manager tasks
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const { StringDecoder } = require('string_decoder');

const config = require('./../configs/config');
const routes = require('./routes');
const { parseJsonToObject } = require('./helpers');
const logger = require('./data/logger.js')('server');

// Instantiate the server module object
var server = {};

/**
 * All the server logic for both HTTP and HTTPS servers
 *
 * @method serverManager
 * @private
 *
 * @param  {Object}      request
 * @param  {Object}      response
 *
 * @return {void}
 */
server.serverManager = function( request, response ) {

   // Get the URL and parse it
   const parse_url = url.parse( request.url, true );

   // Get the path
   const path = parse_url.pathname;
   const trimed_path = path.replace( /^\/+|\/+$/g, '' );

   // Get the query string as an object
   const query_string_object = parse_url.query;

   // Get the HTTP method
   const method = request.method.toLowerCase();

   // Get the headers as an object
   const headers = request.headers;

   // Get the payload, if any
   const decoder = new StringDecoder('utf-8');
   let buffer = '';

   // data collection in the buffer
   request.on('data', function( data ) {
      buffer += decoder.write( data );
   });

   // response on error and log all relevant data.
   request.on('error', error => {
      logger.error({
         messge : 'request error',
         error,
         host : headers.host,
         'user-agent' : headers['user-agent'],
         'accept-encoding' : headers['accept-encoding'],
         'content-length' : headers['content-length'],
         'cache-control' : headers['cache-control'],
         'content-type' : headers['content-type'],
         path,
         url : request.url,
         method,
      });
   });

   // end response
   request.on('end', function() {
      buffer += decoder.end();

      const chosen_rourte = routes.get( trimed_path );

      // Construct the data object to send to the handler
      const data = {
         path : trimed_path,
         query : query_string_object,
         payload : parseJsonToObject( buffer ),
         props : chosen_rourte.props,
         method,
         headers,
      };

      // Log access data
      logger.log(
         'access',
         {
            messge : 'received request',
            host : headers.host,
            'user-agent' : headers['user-agent'],
            'accept-encoding' : headers['accept-encoding'],
            'content-length' : headers['content-length'],
            'cache-control' : headers['cache-control'],
            'content-type' : headers['content-type'],
            path,
            url : request.url,
            method,
         }
      );

      // Route the request to the handler specified in the router
      chosen_rourte.handler( data, function ( status_code, payload ) {
         // Use the status code called back by the handler, or default to 200
         status_code = typeof( status_code ) == 'number' ? status_code : 200;

         // Use the payload called back by the handler, or default to empty object.
         payload = typeof( payload ) == 'object' ? payload : {};

         // Convert the payload to a string
         const payload_string = JSON.stringify( payload );

         // Return the response
         response.setHeader( 'Content-Type', 'application/json' );
         response.writeHead( status_code );
         response.end( payload_string );

         logger.log( null, 'Returning this response for path: ', data.path, status_code, payload_string );
      });
   });
};

/**
 * The response for server listening, which will log the current server port
 *
 * @method serverListener
 * @private
 *
 * @param  {Number}       port
 * 
 * @return {void}
 */
server.serverListener = function( port ) {
   logger[ port == config.http_port ? 'info' : 'attention' ]('The server is listening on port', port);
};

/**
 *
 * @method init
 * @public
 *
 * @return {void}
 */
server.init = function () {
   // Instantiate the HTTP server
   server.http_server = http.createServer( server.serverManager );
   // Instantiate the HTTPS server
   server.https_server = https.createServer( config.https_server_options, server.serverManager);

   // Start the HTTP server
   server.http_server.listen( config.http_port, () => server.serverListener( config.http_port ));

   // Start the HTTPS server
   server.https_server.listen( config.https_port, () => server.serverListener( config.https_port ));
};

 // Export the module
 module.exports = server;
