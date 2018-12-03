/**
 *
 * Helpers for various tasks
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');

// Container for all of the helpers
const helpers = {};

// Create SHA256 hash
helpers.hash = function( str, secret ) {
   if ( typeof( str ) != 'string' && str.trim().legth <= 0 ) {
      return false;
   }

   secret = secret || config.hashing_secret;
   secret = typeof( secret ) == 'number' ? secret.toString(16) : secret;

   return crypto.createHmac( 'sha256', secret ).update( str ).digest( 'hex' );
};

// Parse JSON string to an object in all cases, without throwing error
helpers.parseJsonToObject = function( str ) {
   try {
      return JSON.parse( str || {} );
   } catch ( exception ) {
      return {};
   }
}

module.exports = helpers;
