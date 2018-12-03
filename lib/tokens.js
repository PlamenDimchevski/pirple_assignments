/**
 *
 * Tokens manager
 */

// Dependencies
const data_manager = require('./data');
const helpers = require('./helpers');

const tokens = {};

// Post
// Required data: phone, password
// Optional data: none
tokens.post = function( data, callback ) {
   if ( typeof( data.payload.password ) != 'string' || data.payload.password.trim().length <= 0 ) {
      return callback(400, { 'Error' : 'Password is required'});
   }

   if ( typeof( data.payload.phone ) != 'string' || data.payload.phone.trim().length != 10 ) {
      return callback(400, { 'Error' : 'Please fill correct phone'});
   }

   const token_data = {
      'id' : helpers.createRandomString( 10 ) + Date.now(), // append the current date in unix timestamp, to avoid the neglectable small possibility of id duplication
      'expires' : Date.now() + 1000 * 60 * 60,
      'phone' : data.payload.phone.trim(),
   };

   data_manager.read( 'users', token_data.phone, function( error, user_data ) {
      if ( error || !user_data ) {
         return callback( 400, {'Error' : 'Could not find the specified user.'});
      }

      // Hash the password and compare it to the password stored in the user object
      const hashed_password = helpers.hash( user_data.password, user_data.created_time );

      if ( hashed_password == user_data.password ) {
         return callback( 400, {'Error' : 'Password did not match the specified user\'s stored password'} );
      }

      data_manager.create( 'tokens', token_data.id, token_data, function( error ) {
         if ( error ) {
            return callback( 500, {'Error' : 'Could not create the new token'} );
         }

         callback( 200, token_data );
      });

   });
};

// get
// Required data: id
// Optional data : none
tokens.get = function( data, callback ) {
   if ( typeof( data.query.id ) != 'string' || data.query.id.trim().length != 23 ) {
      return callback(400, { 'Error' : 'Missing required field - id'});
   }

   data_manager.read( 'tokens', data.query.id.trim() , function( error, data ) {
      if ( error || !data ) {
         return callback( 404 );
      }

      callback( 200, data );
   });
};

// Put
// Required data: id, extend
// Optional data: none
tokens.put = function( data, callback ) {
   if ( typeof( data.payload.id ) != 'string' || data.payload.id.trim().length != 23 ) {
      return callback(400, { 'Error' : 'Missing required field - id'});
   }

   if ( typeof( data.payload.extend ) != 'boolean' || !data.payload.extend ) {
      return callback(400, { 'Error' : 'Missing required field - extend, or negative value'});
   }

   const id = data.payload.id.trim();

   data_manager.read( 'tokens', id, function( error, token_data ) {
      if ( error || !token_data ) {
         return callback( 404, { 'Error' : 'Specified token dose not exist'} );
      }

      // Check to make sure the token isn't already expired
      if ( token_data.expires < Date.now() ) {
         return callback( 400, {"Error" : "The token has already expired, and cannot be extended."} );
      }

      token_data.expires = Date.now() + 1000 * 60 * 60;

      // Store the new updates
      data_manager.update( 'tokens', id, token_data, function ( error ) {
         if ( error ){
            return callback( 500, {'Error' : 'Could not update the token\'s expiration.'} );
         }

         callback(200);
      });
   });
};

// delete 
// Required data: id
// Optional data: none
tokens.delete = function( data, callback ) {
   if ( typeof( data.query.id ) != 'string' || data.query.id.trim().length != 23 ) {
      return callback(400, { 'Error' : 'Missing required field - id'});
   }

   const id = data.query.id.trim();

   data_manager.read( 'tokens', id, function( error ) {
      if ( error ) {
         return callback(400,{'Error' : 'Could not find the specified token.'});
      }

      data_manager.delete( 'tokens', id, function( error ) {
         if ( error ) {
            return callback(500,{'Error' : 'Could not delete the specified token'});
         }

         callback(200);
      });
   });
};

// Verify if a given token id is currently valid for a given user
tokens.verifyToken = function( headers, phone, callback ) {
   const message = "Missing required token in header, or token is invalid.";

   if ( typeof( headers.token ) != 'string' ) {
      return callback( false, message );
   }

   data_manager.read( 'tokens', headers.token, function( error, token_data ) {
      if ( error || !token_data ) {
         callback( false, message );
      }

      if ( token_data.phone != phone || token_data.expires < Date.now() ) {
         callback( false, message );
      }

      callback( true, '' );
   });
};

module.exports = tokens;
