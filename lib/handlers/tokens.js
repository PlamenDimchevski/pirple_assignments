/**
 *
 * Tokens manager
 */

// Dependencies
const db = require('./../data/db');
const helpers = require('./../helpers');
const errors  = require('./../../configs/errors');

/**
 * Definition of the main tokens object with the main constants used in this module
 *
 * @type {Object}
 */
const tokens = {
   // Representation of the tokens data schema
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
      {
         name : 'extend',
         type : 'boolean'
      },
   ],

   // Use base error object keys, to create personalized errors for this module
   errors : {
      ...errors,

      // Custom user error message to override the db module errors
      [ errors.CODES.FAIL_CREATE_FILE ]            : 'Could not create token for user',
      [ `${errors.CODES.FAIL_READING_FILE}_user` ] : 'Error reading the requested user to create token',
      [ errors.CODES.FAIL_READING_FILE ]           : 'Error reading the requested token',
      [ errors.CODES.FAIL_WRITING_FILE ]           : 'Error updating the token',
      [ errors.CODES.FAIL_CLOSING_FILE ]           : 'Error closing the token file',
      [ errors.CODES.FAIL_OPEN_FILE ]              : 'Error opening the requested token',
      [ errors.CODES.FAIL_TRUNCATING_FILE ]        : 'Error truncating token file',
      [ errors.CODES.FAIL_DELETING_FILE ]          : 'Error deleting token',
   },

   expires_after : 1000 * 60 * 60,
   id_length     : 20,

   // Placeholders for the nested methods
   routes : {},
   handlers : {},
};

/**
 * Create a token for a given user
 *
 * @method post
 * @private
 * @async
 *
 * @param  {Object}   data
 * @param  {Function} callback
 *
 * @return {void}
 *   @field    { Error code } { success:Boolean, message:String, error:Object(optional) }
 *   @success  { 200 } { success:Boolean, data:Object }
 */
tokens.post = function( data, callback ) {
   const token_data_received = helpers.validateData( data.payload, tokens.properties );

   if ( !token_data_received.password ) {
      return callback( 400, { success: false, message: 'Password is required' } );
   }

   if ( !helpers.isEmail( token_data_received.email ) ) {
      return callback( 400, { success: false, message: 'Please fill correct email' } );
   }

   const token_data = {
      'id' : helpers.createUniqueRandomString( tokens.id_length ),
      'expires' : Date.now() + tokens.expires_after,
      'email' : token_data_received.email,
   };

   db.read( 'users', helpers.mailToFileName( token_data.email ) )
      .then( user_data => {

         // Hash the password and compare it to the password stored in the user object
         const hashed_password = helpers.hash( token_data_received.password, user_data.created_time );

         if ( hashed_password !== user_data.password ) {
            callback( 400, { success: false, message : 'Password did not match the specified user\'s stored password' } );
         } else {
            db.create( 'tokens', token_data.id, token_data )
               .then( () => callback( 200, { success: true, data: token_data } ))
               .catch( ( error_code, message, error ) => callback( 500, { success: false, message: tokens.errors[ error_code ], error } ) );
         }
      })
      .catch( ( error_code, message, error ) => callback( 400, { success: false, message: tokens.errors[ `${error_code}_user` ] || tokens.errors[ error_code ], error } ) );
};

/**
 * Get the token.
 *
 * @method get
 * @private
 * @async
 *
 * @param  {Object}   data
 * @param  {Function} callback
 *
 * @return {void}
 *   @field    { Error code } { success:Boolean, message:String, error:Object(optional) }
 *   @success  { 200 } { success:Boolean, data:Object }
 */
tokens.get = function( data, callback ) {
   const token_data = helpers.validateData( { id: data.props.id || data.query.id }, tokens.properties );

   if ( token_data.id.length != tokens.id_length ) {
      return callback(400, { success: false, message: 'Missing required field - id' } );
   }

   db.read( 'tokens', token_data.id )
      .then( data => callback( 200, { success: true, data } ))
      .catch( ( error_code, message, error ) => callback( 500, { success: false, message: tokens.errors[ error_code ], error } ) );
};

/**
 * Update the token expiration
 *
 * @method put
 * @private
 * @async
 *
 * @param  {Object}   data
 * @param  {Function} callback
 *
 * @return {void}
 *   @field    { Error code } { success:Boolean, message:String, error:Object(optional) }
 *   @success  { 200 } { success:Boolean }
 */
tokens.put = function( data, callback ) {
   const token_data_received = helpers.validateData( data.payload, tokens.properties );

   if ( token_data_received.id.length != tokens.id_length ) {
      return callback(400, { success: false, message: 'Missing required field - id, or not correct length' } );
   }

   if ( !token_data_received.extend ) {
      return callback(400, { success: false, message: 'Missing required field - extend, or negative value' } );
   }

   db.read( 'tokens', token_data_received.id )
      .then( token_data => {
         if ( token_data.expires < Date.now() ) {
            callback( 400, { success: false, message: "The token has already expired, and cannot be extended." } );
         } else {
            token_data.expires = Date.now() + tokens.expires_after;
            db.update( 'tokens', token_data_received.id, token_data )
               .then( () => callback( 200, { success: true } ) )
               .catch( ( error_code, message, error ) => callback( 500, { success: false, message: tokens.errors[ error_code ], error } ) );
         }
      })
      .catch( ( error_code, message, error ) => callback( 500, { success: false, message: tokens.errors[ error_code ], error } ) );
};

/**
 *
 * @method delete
 * @private
 * @async
 *
 * @param  {Object}   data
 * @param  {Function} callback
 *
 * @return {void}
 *   @field    { Error code } { success:Boolean, message:String, error:Object(optional) }
 *   @success  { 200 } { success:Boolean }
 */
tokens.delete = function( data, callback ) {
   const token_data = helpers.validateData( { id: data.props.id || data.query.id }, tokens.properties );

   if ( token_data.id.length != tokens.id_length ) {
      return callback(400, { success: false, message: 'Missing required field - id' } );
   }

   db.read( 'tokens', token_data.id )
      .then( () => db.delete( 'tokens', token_data.id ) )
      .then( () => callback( 200, { success: true } ) )
      .catch( ( error_code, message, error ) => callback( 500, { success: false, message: tokens.errors[ error_code ], error } ) );
};

/**
 * Verify if a given token id is currently valid for a given user
 *
 * @method verifyToken
 * @public
 * @async
 *
 * @param  {Object}    headers
 * @param  {String}    email
 *
 * @return {void}
 *   @field    { Error code } { message, error code, error object }
 *   @success  { void }
 */
tokens.verifyToken = function( headers, email ) {
   return new Promise( ( resolve, reject ) => {
      if ( typeof( headers.token ) != 'string' ) {
         return reject( errors.CODES.NO_TOKEN_IN_HEADER, errors[ errors.CODES.NO_TOKEN_IN_HEADER ], {} );
      }

      db.read( 'tokens', headers.token )
         .then( token_data => {
            if ( token_data.email != email || token_data.expires < Date.now() ) {
               reject( errors.CODES.FAIL_TOKEN_VERIFICATION, errors[ errors.CODES.FAIL_TOKEN_VERIFICATION ], {} );
            } else {
               resolve();
            }
         })
         .catch( reject )
   });
};

/**
 * This method will manage the correct response for the most routes for the tokens
 *
 * @method manager
 * @private
 *
 * @param  {Object}   data
 * @param  {Function} callback
 *
 * @return {void}
 */
tokens.handlers.manager = function( data, callback ) {
   if ( ['post', 'get', 'put', 'delete'].includes( data.method ) ) {
      return tokens[data.method]( data, callback );
   }

   callback( 405 );
};

/**
 * Definition for the tokens routs.
 * The routes module will search for this sub object `routes` in the tokens module to include them as possible routs
 *
 * @type {Object}
 */
tokens.routes = {
   'token' : tokens.handlers.manager,
   'token/{id}' : tokens.handlers.manager,
};

// Export the module
module.exports = tokens;
