/**
 *
 * Helpers for various tasks
 */

// Dependencies
const crypto = require('crypto');
const https  = require('https');
const querystring = require('querystring');

const config = require('./../configs/config');

// Container for all of the helpers
const helpers = {};

/**
 * Parse JSON string to an object in all cases, without throwing error
 *
 * @method parseJsonToObject
 * @private
 *
 * @param  {String}          str
 *
 * @return {Object}
 */
helpers.parseJsonToObject = function( str ) {
   try {
      return JSON.parse( str || '{}' );
   } catch ( exception ) {
      return {};
   }
};

/**
 * Create a string of random alphanumeric characters,of given length with append suffix of the current date in base 16, to ensure uniqueness
 *
 * @method createUniqueRandomString
 * @public
 *
 * @param  {Number}                 str_length
 *
 * @return {String}
 */
helpers.createUniqueRandomString = function( str_length ) {
   // Define all the possible characters that could go into a string
   let possible_characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
   // Get suffix for the random number based on the date, to ensure that it will not repeat the same string
   const suffix = Date.now().toString( 16 );

   // If no length is passed, return the suffix only
   if ( typeof( str_length ) !== 'number' && str_length < 1 ) {
      return suffix;
   }

   let random_str = Array.from(
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
   .join('') + suffix;

   // Append the suffix to the randomly generated number and return only the required length starting from the back to preserve the date suffix in base 16
   // Example if need 15 and the random string is bx3tkkrm2y8f3q7 and the suffix is 16793dcaa27, the end result will be 16793dcaa27
   return random_str.substring( random_str.length - str_length );
};

/**
 * Create SHA256 hash
 *
 * @method hash
 * @public
 *
 * @param  {String} str
 * @param  {Number} secret
 *
 * @return {String}
 */
helpers.hash = function( str, secret, encryption ) {
   if ( typeof( str ) != 'string' && str.trim().legth <= 0 ) {
      return false;
   }

   secret = secret || config.hashing_secret;
   secret = typeof( secret ) == 'number' ? secret.toString(16) : secret;

   return crypto.createHmac( encryption || 'sha256', secret ).update( str ).digest( 'hex' );
};

/**
 * Validate the received data, based on a preset list of key name and content type
 *
 * @method validateData
 * @public
 *
 * @param  {Object}     data
 * @param  {Array}      allowed_properties
 * 
 * @example of {allowed_properties} content. It expects [ { name : 'first_name', type : 'string' }, ... ]
 *
 * @return {Object}
 */
helpers.validateData = function( data, allowed_properties ) {
   // Map the type for the allowed properties to the correct instance, when the `typeof()` method will return 'object',
   // to allow their validation without additional complexity to the `allowed_properties` param.
   const instance_obj = {
      'array' : Array,
      'object': Object,
   };

   // Ensure that only the required data will be saved, and no other passed properties.
   return allowed_properties.reduce(
      ( obj, element ) => {
         const key = element.name;

         let value = typeof( data[ key ] ) == 'string' ? data[ key ].trim() : data[ key ];
         let is_valid_type = false;

         // test the value type
         if ( Object.keys( instance_obj ).includes( element.type ) ) {
            is_valid_type = typeof( value ) == 'object' && value instanceof instance_obj[ element.type ];
         } else {
            is_valid_type = typeof( value ) == element.type;
         }

         // return the object so far if the value is not valid, which will ease the testing
         if ( !value || !is_valid_type ) {
            return obj;
         }

         return {
            ...obj,
            [ key ]: value
         };
      },
      {}
   );
};

/**
 * Test if the given value is email
 * The test is short and sweet, but incomplete and can fail in quite valid emails
 *
 * @method isEmail
 * @public
 *
 * @param  {String} email
 *
 * @return {Boolean}
 */
helpers.isEmail = function ( email ) {
   return /\S+@\S+\.\S+/.test( email );
};

helpers.mailToFileName = function( email ) {
   return (email || '').replace(/@/g, '__');
};

// Export the module
module.exports = helpers;
