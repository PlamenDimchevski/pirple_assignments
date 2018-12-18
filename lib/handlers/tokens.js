/**
 *
 * Tokens manager
 */

// Dependencies
const db = require('./../data/db');
const helpers = require('./../helpers');

const tokens = {
   // Representation of the users data schema
   properties : [
      {
         name : 'id',
         type : 'string',
      },
      {
         name : 'password',
         type : 'string',
      },
      {
         name : 'email',
         type : 'string',
      },
      {
         name : 'expires',
         type : 'number',
      },
   ],

   expires_after : 1000 * 60 * 60,
   id_length     : 20,

   // Placeholders for the nested methods
   routes : {},
   handlers : {},
};

tokens.handlers.manager = function( data, callback ) {
   if ( data.props.id ) {
      return users.get( data, callback );
   }
   if ( ['post', 'get', 'put', 'delete'].includes(data.method) ) {
      return tokens[data.method]( data, callback );
   }

   callback( 405 ); 
};


// Post
// Required data: phone, password
// Optional data: none
tokens.post = function( data, callback ) {
   const token_data_received = helpers.validateData( data.payload, tokens.properties );

   if ( !token_data_received.password ) {
      return callback(400, { 'Error' : 'Password is required'});
   }

   if ( !helpers.isEmail( token_data_received.email ) ) {
      return callback(400, { 'Error' : 'Please fill correct phone'});
   }

   const token_data = {
      'id' : helpers.createUniqueRandomString( tokens.id_length ),
      'expires' : Date.now() + tokens.expires_after,
      'email' : token_data_received.email,
   };

   db.read( 'users', helpers.mailToFileName( token_data.email ) )
      .then( user_data => {

         // Hash the password and compare it to the password stored in the user object
         const hashed_password = helpers.hash( user_data.password, user_data.created_time );

         if ( hashed_password == token_data_received.password ) {
            callback( 400, {'Error' : 'Password did not match the specified user\'s stored password'} );
         } else {

            db.create( 'tokens', token_data.id, token_data )
               .then( () => callback( 200, token_data ))
               .catch( () => callback( 500, {'Error' : 'Could not create the new token'} ));
         }
      })
      .catch( () => {
         callback( 400, {'Error' : 'Could not find the specified user.'} )
      });
};

// get
// Required data: id
// Optional data : none
tokens.get = function( data, callback ) {
   const token_data = helpers.validateData( data.props.id ? data.props : data.query, tokens.properties );

   if ( token_data.id.length != tokens.id_length ) {
      return callback(400, { 'Error' : 'Missing required field - id'});
   }

   db.read( 'tokens', token_data.id )
      .then( data => callback( 200, data ))
      .catch( ( message, error ) => callback( 404, { message, error } ) );
};

// Put
// Required data: id, extend
// Optional data: none
tokens.put = function( data, callback ) {
   const token_data_received = helpers.validateData( data.payload, tokens.properties );

   if ( token_data_received.id.length != tokens.id_length ) {
      return callback(400, { 'Error' : 'Missing required field - id'});
   }

   if ( !token_data_received.extend ) {
      return callback(400, { 'Error' : 'Missing required field - extend, or negative value'});
   }

   db.read( 'tokens', token_data_received.id )
      .then( token_data => {
         if ( token_data.expires < Date.now() ) {
            callback( 400, {"Error" : "The token has already expired, and cannot be extended."} );
         } else {
            token_data.expires = Date.now() + tokens.expires_after;
            db.update( 'tokens', token_data_received.id, token_data )
               .then( () => callback( 200 ) )
               .catch( () => callback( 500, {'Error' : 'Could not update the token\'s expiration.'} ));
         }
      })
      .catch( () => callback( 404, { 'Error' : 'Specified token dose not exist'} ) );
};

// delete 
// Required data: id
// Optional data: none
tokens.delete = function( data, callback ) {
   const token_data = helpers.validateData( data.query, tokens.properties );
   if ( token_data.id.length != tokens.id_length ) {
      return callback(400, { 'Error' : 'Missing required field - id'});
   }

   db.read( 'tokens', token_data.id )
      .then( () => db.delete( 'tokens', token_data.id ) )
      .then( () => callback( 200 ) )
      .catch( ( message, error ) => callback( 400, { message, error } ) );
};

// Verify if a given token id is currently valid for a given user
tokens.verifyToken = function( headers, email, callback ) {
   const message = "Missing required token in header, or token is invalid.";

   return new Promise( ( resolve, reject ) => {
      if ( typeof( headers.token ) != 'string' ) {
         return reject( message, {} );
      }

      db.read( 'tokens', headers.token )
         .then( token_data => {
            if ( token_data.email != email || token_data.expires < Date.now() ) {
               reject( message, {} );
            } else {
               resolve();
            }
         })
         .catch( reject )
   });
};

tokens.routes = {
   'token' : tokens.handlers.manager,
   'token/{id}' : tokens.handlers.manager,
};


module.exports = tokens;
