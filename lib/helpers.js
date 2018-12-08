/**
 *
 * Helpers for various tasks
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');
const https  = require('https');
const querystring = require('querystring');

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

helpers.getAllowedData = function( data, allowed_properties ) {
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

helpers.sendTwilioSms = function( phone, msg, callback ){
   // Validate parameters
   phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
   msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;

   if( phone && msg ){

      // Configure the request payload
      var payload = {
         'From' : config.twilio.fromPhone,
         'To' : '+1'+phone,
         'Body' : msg
      };
      var stringPayload = querystring.stringify(payload);


      // Configure the request details
      var requestDetails = {
         'protocol' : 'https:',
         'hostname' : 'api.twilio.com',
         'method' : 'POST',
         'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
         'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
         'headers' : {
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(stringPayload)
         }
      };

      // Instantiate the request object
      var req = https.request(requestDetails,function(res){
         // Grab the status of the sent request
         var status =  res.statusCode;
         // Callback successfully if the request went through
         if(status == 200 || status == 201){
            callback(false);
         } else {
            callback('Status code returned was '+status);
         }
      });

      // Bind to the error event so it doesn't get thrown
      req.on('error',function(e){
         callback(e);
      });

      // Add the payload
      req.write(stringPayload);

      // End the request
      req.end();

   } else {
      callback('Given parameters were missing or invalid');
   }
};

module.exports = helpers;
