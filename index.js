/**
 *
 * Primary file for the API
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const { StringDecoder } = require('string_decoder');
const config = require('./config');
const routes = require('./routes');

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
const serverManager = function( request, response ) {

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

   request.on('data', function( data ) {
      buffer += decoder.write( data );
   });

   request.on('end', function() {
      buffer += decoder.end();

      const chosen_handler = routes.get( trimed_path );

      // Construct the data object to send to the handler
      const data = {
         'path' : trimed_path,
         'query' : query_string_object,
         'payload' : buffer,
         method,
         headers,
      };

      // Route the request to the handler specified in the router
      chosen_handler( data, function ( status_code, payload ) {
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

         console.log( 'Returning this response: ', status_code, payload_string );
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
const serverListener = function( port ) {
   console.log('The server is listening on port', port);
};

// Instantiate the HTTP server
const http_server = http.createServer( serverManager );

// Start the HTTP server
http_server.listen( config.http_port, () => serverListener( config.http_port ));

// Instantiate the HTTPS server
const https_server = https.createServer( config.https_server_options, serverManager);

// Start the HTTPS server
https_server.listen( config.https_port, () => serverListener( config.https_port ));
