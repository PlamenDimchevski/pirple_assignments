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

helpers.getAllowedUserData = function( data ) {
   const allowed_properties = [ 'first_name', 'last_name', 'phone', 'password', 'tos_agreement', ];
   // Ensure that only the required data will be saved, and no other passed properties.
   return allowed_properties.reduce( (obj, key) => ({
      ...obj,
      [ key ]: typeof(data[ key ]) == 'string' ? data[ key ].trim() : data[ key ]
   }), {} );
}

// Create a string of random alphanumeric characters, of given length
helpers.createRandomString = function( str_length ) {
   // Define all the possible characters that could go into a string
   const possible_characters = 'abcdefghijklmnopqrstuvwxyz0123456789';

   str_length = typeof( str_length ) == 'number' && str_length > 0 ? str_length : false;

   if ( !str_length ) {
      return false;
   }

   return Array.from(
      // Create an array with the given length
      { length: str_length },
      // Get a random charactert from the possibleCharacters string
      ( _, item ) => possible_characters.charAt(
                        Math.floor(
                           Math.random() * possible_characters.length
                        )
                     )
   )
   // Append this character as a string
   .join('');
};


module.exports = helpers;
