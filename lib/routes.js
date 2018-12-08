/**
 *
 * Register of all routers and method for getting the correct one per given path
 */

// Dependencies
const handlers = require('./handlers');

// Define a request router
const router = {
   'ping' : handlers.ping,
   'users' : handlers.users,
   'tokens' : handlers.tokens,
   'checks' : handlers.checks,
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
      const chosen_router = router[ path ];
      return typeof( chosen_router ) !== 'undefined' ? chosen_router : handlers.notFound;
   }
};
