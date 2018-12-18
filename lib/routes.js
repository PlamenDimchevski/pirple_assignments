/**
 *
 * Register of all routers and method for getting the correct one per given path
 */

// Dependencies
const menu = require('./handlers/menu');
const users = require('./handlers/users');
const tokens = require('./handlers/tokens');

// Define a request handlers and collect each hendler from the hendler modules
const handlers = {
   /**
    *
    * @method ping
    * @public
    *
    * @param  {Object}   data
    * @param  {Function} callback
    *
    * @return {void}
    */
   ping( data, callback ) {
      callback( 200 );
   },

   /**
    * Not found handler
    *
    * @method notFound
    * @public
    *
    * @param  {Object}   data
    * @param  {Function} callback
    *
    * @return {void}
    */
   notFound( data, callback ) {
      callback( 404 );
   },
};

// Define a request router
const router = {
   // Add required modules routes
   ...menu.routes,
   ...users.routes,
   ...tokens.routes,

   'ping' : handlers.ping,
};

// Export the module
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
   get( path ) {
      const path_length = path.split('/').length;
      const placeholder_regex = /\{[^\}]+\}/g;
      const placeholder_replacement = '([^\/]+)';

      let path_props = {};

      // Go thru route to map the placeholders and find which expression corresponds to the given path
      const chosen_router = Object.keys( router ).find( item => {
         // ignore shorter than the given route
         if ( item.split('/').length < path_length ) {
            return false;
         }

         // Replace the {placeholders} in the path with regex, so we can validate the path and get the passed value for the placeholder
         const path_test = new RegExp( item.replace(placeholder_regex, placeholder_replacement));

         // Get the list with the placeholder to get their names
         const props = item.match(placeholder_regex) || [];
         // Get the values based on the path test, to be able to get only the the values we want
         const values = path.match(path_test);

         // If there are values, lets map them to an object using the props as key
         // This validation is needed, since if we have same number of placeholders in the same order but for different path this mapping will wail
         // Example for this case: menu/{category} and user/{name} will collide depending on which one we look for and which it comes first for test
         if ( values ) {
            path_props = props.reduce(
               ( obj, key, index ) => {
                  // remove the curly brackets from the key if is not null/undefined
                  key = key ? key.replace(/\{|\}/g, '') : key;
                  return {
                     ...obj,
                     [ key ] : values[ index + 1 ],
                  }
               },
               {}
            );
         }

         return path_test.test( path );
      });

      return {
         handler : typeof( chosen_router ) !== 'undefined' ? router[ chosen_router ] : handlers.notFound,
         props : path_props,
      };
   },
};
