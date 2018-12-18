/**
 *
 * User manager
 */

// Dependencies
const db = require('./../data/db');
const helpers = require('./../helpers');
const { verifyToken } = require('./tokens');
const errors  = require('./../../configs/errors');

/**
 * Definition of the main users object with the main constants used in this module
 *
 * @type {Object}
 */
const users = {
   // Representation of the users data schema
   properties : [
      {
         name : 'first_name',
         type : 'string',
      },
      {
         name : 'last_name',
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
         name : 'address',
         type : 'string',
      },
      {
         name : 'phone',
         type : 'string',
      },
      {
         name : 'tos_agreement',
         type : 'boolean',
      },
      {
         name : 'created_time',
         type : 'number',
      },
   ],

   // Use base error object keys, to create personalized errors for this module
   errors : {
      ...errors,

      // Custom user error message to override the db module errors
      [ errors.CODES.FAIL_CREATE_FILE ]     : 'Could not create this user, it may already exist',
      [ errors.CODES.FAIL_READING_FILE ]    : 'Error reading the requested user',
      [ errors.CODES.FAIL_WRITING_FILE ]    : 'Error writing to this user',
      [ errors.CODES.FAIL_CLOSING_FILE ]    : 'Error closing the user file',
      [ errors.CODES.FAIL_OPEN_FILE ]       : 'Error opening the requested user',
      [ errors.CODES.FAIL_TRUNCATING_FILE ] : 'Error truncating user file',
      [ errors.CODES.FAIL_DELETING_FILE ]   : 'Error deleting user',
   },

   // Placeholders for the nested methods
   routes : {},
   handlers : {},
   helpers  : {},
};

/**
 * Test all allowed properties in user manager, and return an object with the corresponding error messages
 *
 * @method data_validation
 * @private
 *
 * @param  {Object}        user_data
 *
 * @return {Object}
 */
users.data_validation = function ( user_data ) {
   let errors = {};

   if ( !user_data.first_name ) {
      errors.first_name = 'No valid first name is provided';
   }

   if ( !user_data.last_name ) {
      errors.last_name = 'No valid last name is provided';
   }

   if ( !user_data.password ) {
      errors.password = 'No valid password is provided';
   }

   if ( !user_data.address ) {
      errors.address = 'No valid address is provided';
   }

   if ( !user_data.phone || user_data.phone.length != 10 ) {
      errors.phone = 'No valid phone is provided';
   }

   if ( !user_data.tos_agreement ) {
      errors.tos_agreement = 'Please accept the term of service';
   }

   if ( !helpers.isEmail( user_data.email ) ) {
      errors.email = 'No valid email is provided';
   }

   return errors;
};

/**
 * Verifies the received data and utilizes the db module to save the user
 *
 * @method post
 * @private
 *
 * @param  {Object}   data
 * @param  {Function} callback
 *
 * @return {void}
 */
users.post = function( data, callback ) {
   const user_data = helpers.validateData( data.payload, users.properties );
   const file_name = helpers.mailToFileName( user_data.email );
   const data_validation = users.users.data_validation( user_data );

   // Validate received data
   if ( !Object.keys( user_data ).length ) {
      return callback( 400, { message : 'No allowed properties were passed', error_code: 'create_user' } );
   }

   if ( Object.keys( data_validation ).length > 0 ) {
      return callback(400, { message : 'No valid properties were provided', error_code: 'create_user', error : data_validation } );
   }

   // Add created date which will be used for password hashing secret
   user_data.created_time = Date.now();

   // Update tos_agreement to boolean value
   // If we get to here it was all ready true
   user_data.tos_agreement = true;

   // Hash the password
   user_data.password = helpers.hash( user_data.password, user_data.created_time );

   if ( !user_data.password ) {
      return callback( 500, { message : users.errors[ users.errors.CODES.FAIL_PASSWORD_HASH ], error_code: 'create_user' } );
   }

   // Create the new user
   db.read( 'users', file_name )
      // We successfully open a file with the current email, therefore will return notification that this user already exists
      .then( () => callback( 400, { message : 'User with this email are already exist', error_code: 'create_user' } ) )
      // Can't open this file, which for opening is an error, but for use means that such user do not exists and we can proceed.
      .catch( () => db.create( 'users', file_name ) )
      .then( () => callback( 200 ) )
      .catch( ( error_code, message, error ) => callback( 400, { message : users.errors[ error_code ], error_code, error } ) );
};

/**
 * Returns to the callback the data of the selected user if exist
 * This method will receive either a query value `email`, or a prop value, which come from the routes parameters
 *
 * @method get
 * @private
 *
 * @param  {Object}   data
 * @param  {Function} callback
 *
 * @return {void}
 */
users.get = function( data, callback ) {
   const user_data = helpers.validateData( data.props.email ? data.props : data.query, users.properties );
   const file_name = helpers.mailToFileName( user_data.email );

   if ( !helpers.isEmail( user_data.email ) ) {
      return callback( 400, { message : 'No valid email is provided', error_code : 'read_user' } );
   }

   verifyToken( data.headers, file_name )
      .then( () => db.read( 'users', file_name ) )
      .then( data => {
         // Prevent returning the sensitive data
         delete data.password;
         delete data.created_time;

         callback( 200, data );
      })
      .catch( ( error_code, message, error ) => callback( 404, { message : users.errors[ error_code ], error_code, error } ) )
};

/**
 * Update the user data after verifying the input it
 *
 * @method put
 * @private
 *
 * @param  {Object}   data
 * @param  {Function} callback
 *
 * @return {void}
 */
users.put = function( data, callback ) {
   const user_data = helpers.getAllowedData( data.payload, users.properties );
   const file_name = helpers.mailToFileName( user_data.email );
   const data_validation = users.users.data_validation( user_data );

   // If password is provided for updating, Hash the new password
   if ( user_data.password ) {
      user_data.password = helpers.hash( user_data.password, user_data.created_time );
   }

   // Prevent of updating of protected properties as the email
   delete user_data.email;
   delete user_data.tos_agreement;
   delete user_data.created_time;

   // Check if there are filed for updating
   if ( !Object.keys( user_data ).length  ) {
      return callback(400, { message : 'Missing fields to update' } );
   }

   // Get errors only for the provided fields, since this are the only one that need updating
   const errors_in_provided_fields = Object.keys( user_data ).reduce(
      ( obj, key ) => ({ ...obj, [ key ] : data_validation[ key ] }),
      {}
   );

   if ( !Object.keys( errors_in_provided_fields ).length ) {
      return callback(400, { message : 'No valid properties were provided', error_code: 'create_user', error : data_validation } );
   }

   verifyToken( data.headers, file_name )
      .then( () => db.read( 'users', file_name ) )
      .then( data => db.update( 'users', file_name, { ...data, ...user_data } ) )
      .then( () => callback( 200 ) )
      .catch( ( error_code, message, error ) => callback( 404, { message : users.errors[ error_code ], error_code, error } ) );

};

/**
 * Removal of the selected user
 *
 * @method delete
 * @private
 *
 * @param  {[type]}   data     [description]
 * @param  {Function} callback [description]
 *
 * @return {[type]}   [description]
 */
users.delete = function( data, callback ) {
   const user_data = helpers.getAllowedData( data.query, users.properties );
   const file_name = helpers.mailToFileName( user_data.email );

   if ( !handlers.isEmail( user_data.email ) ) {
      return callback(400, { 'Error' : 'Missing required field - phone'});
   }

   verifyToken( data.headers, file_name )
      .then( () => db.read( 'users', file_name ) )
      .then( data => db.delete( 'users', file_name ) )
      .then( () => callback( 200 ) )
      .catch( ( error_code, message, error ) => callback( 404, { message, error } ));
};

/**
 * This method will manage the correct response for the most routes for the users
 *
 * @method manager
 * @private
 *
 * @param  {Object}   data
 * @param  {Function} callback
 *
 * @return {void}
 */
users.handlers.manager = function( data, callback ) {
   if ( data.props.email ) {
      return users.get( data, callback );
   }
   if ( ['post', 'get', 'put', 'delete'].includes(data.method) ) {
      return users[data.method]( data, callback );
   }

   callback( 405 );
};

/**
 * Definition for the user routs.
 * The routes module will search for this sub object `routes` in the users module to include them as possible routs
 *
 * @type {Object}
 */
users.routes = {
   'users' : users.handlers.manager,
   'users/{email}' : users.handlers.manager,
};

// Export the module
module.exports = users;
