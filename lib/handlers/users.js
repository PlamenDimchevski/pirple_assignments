/**
 *
 * User manager
 */

// Dependencies
const db = require('./../data/db');
const helpers = require('./../helpers');
const { verifyToken } = require('./tokens');
const errors  = require('./../../configs/errors');

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

   },

   // Placeholders for the nested methods
   routes : {},
   handlers : {},
   helpers  : {},
};

users.handlers.manager = function( data, callback ) {
   if ( data.props.email ) {
      return users.get( data, callback );
   }
   if ( ['post', 'get', 'put', 'delete'].includes(data.method) ) {
      return users[data.method]( data, callback );
   }

   callback( 405 ); 
};

users.post = function( data, callback ) {
   
   const user_data = helpers.validateData( data.payload, users.properties );
   
   // Validate received data
   if ( !Object.keys( user_data ).length ) {
      return callback( 400, { 'Error' : 'No allowed properties were passed'} );
   }

   if ( !user_data.first_name ) {
      return callback(400, { 'Error' : 'First name is required'});
   }

   if ( !user_data.last_name ) {
      return callback(400, { 'Error' : 'Last name is required'});
   }

   if ( !helpers.isEmail( user_data.email ) ) {
      return callback(400, { 'Error' : 'Email is required'});
   }

   if ( !user_data.password ) {
      return callback(400, { 'Error' : 'Password is required'});
   }

   if ( !user_data.address ) {
      return callback(400, { 'Error' : 'Password is required'});
   }

   if ( !user_data.phone || user_data.phone.length != 10 ) {
      return callback(400, { 'Error' : 'Please fill correct phone'});
   }

   if ( !user_data.tos_agreement ) {
      return callback(400, { 'Error' : 'Please accept the term of service'});
   }

   // Add created date which will be used for password hashing secret
   user_data.created_time = Date.now();

   // Update tos_agreement to boolean value
   // If we get to here it was all ready true
   user_data.tos_agreement = true;

   // Hash the password
   user_data.password = helpers.hash( user_data.password, user_data.created_time );

   if ( !user_data.password ) {
      return callback( 500, errors[ errors.CODES.FAIL_PASSWORD_HASH ] );
   }

   db.read( 'users', helpers.mailToFileName( user_data.email ) )
      .then( () => db.create( 'users', helpers.mailToFileName( user_data.email ) ) )
      .then( () => callback( 200 ) )
      .catch( ( message, error ) => callback( 400, { message, error } ) );
};

users.get = function( data, callback ) {
   const user_data = helpers.validateData( data.props.email ? data.props : data.query, users.properties );

   if ( !helpers.isEmail( user_data.email ) ) {
      return callback(400, { 'Error' : 'No valid email is provided'});
   }

   verifyToken( data.headers, helpers.mailToFileName( user_data.email ) )
      .then( () => {
         db.read( 'users', helpers.mailToFileName( user_data.email ) )
            .then( data => {
               delete data.password;
               delete data.created_time;

               callback( 200, data );
            })
            .catch( ( message, error ) => 
               callback( 404, { message, error } )
            );
      })
      .catch( ( message, error ) => callback( 404, { message, error } ))
};

users.put = function( data, callback ) {
   const user_data = helpers.getAllowedData( data.payload, users.properties );

   // Check for the required fields
   if ( handlers.isEmail( user_data.email ) ) {
      return callback(400, { 'Error' : 'Missing required field - phone'});
   }

   // check for the optional fields
   // If there are more than one element (including phone)
   if ( Object.keys( user_data ).length <= 1 ) {
      return callback(400, { 'Error' : 'Missing fields to update'});
   }

   verifyToken( data.headers, helpers.mailToFileName( user_data.email ) )
      .then( () => {
         db.read( 'users', helpers.mailToFileName( user_data.email ) )
            .then( data => db.update( 'users', helpers.mailToFileName( user_data.email ), { ...data, ...user_data } ) )
            .then( () => callback( 200 ) )
            .catch( ( message, error ) => callback( 404, { message, error } ) );
      })
      .catch( ( message, error ) => callback( 404, { message, error } ));

};

users.delete = function( data, callback ) {
   const user_data = helpers.getAllowedData( data.query, users.properties );

   if ( !handlers.isEmail( user_data.email ) ) {
      return callback(400, { 'Error' : 'Missing required field - phone'});
   }

   verifyToken( data.headers, helpers.mailToFileName( user_data.email ) )
      .then( () => {
         db.read( 'users', helpers.mailToFileName( user_data.email ) )
            .then( data => db.delete( 'users', helpers.mailToFileName( user_data.email ) ) )
            .then( () => callback( 200 ) )
            .catch( ( message, error ) => callback( 404, { message, error } ) );
      })
      .catch( ( message, error ) => callback( 404, { message, error } ));
};

users.routes = {
   'users' : users.handlers.manager,
   'users/{email}' : users.handlers.manager,
};


// Export the module
module.exports = users;
