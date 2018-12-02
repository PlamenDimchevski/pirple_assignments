/**
 *
 * Register of all handlers for the supported routers
 */

// Define the handlers
var handlers = {};

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
   let message = typeof(data.query.name) === 'string' ? data.query.name : 'World';

   // Test if the payload contains JSON with the 'name' key, to print personalized hello message
   try {
      let payload = JSON.parse( data.payload || {} );
      message = payload.name || message;
   } catch( exception ) {
      // Ignore all exception.
   }

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

// Define a request router
var router = {
   'ping' : handlers.ping,
   'hello': handlers.hello,
};


module.exports = {
   /**
    * Choose the handler this request should go to. If one is not found, use the notFound handler
    *
    * @method get
    * @public
    *
    * @param  {String} path
    *
    * @return {Function} the chosen handler
    */
   get : function( path ) {
      var chosen_router = router[ path ]; 
      return typeof( chosen_router ) !== 'undefined' ? chosen_router : handlers.notFound;
   }
};
