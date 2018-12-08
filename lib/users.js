/**
 *
 * User manager
 */

// Dependencies
const data_manager = require('./data');
const helpers = require('./helpers');
const { verifyToken } = require('./tokens');

const users = {};

users.allowed_properties = [ 'first_name', 'last_name', 'phone', 'password', 'tos_agreement', 'checks' ];

// Post
// Required data: first_name, last_name, phone, password, tos_agreement
// Optional data: none
users.post = function( data, callback ) {
   
   const user_data = helpers.getAllowedData( data.payload, users.allowed_properties );
   
   // Validate received data
   if ( !Object.keys( user_data ).length ) {
      return callback(400, { 'Error' : 'No allowed properties were passed'});
   }

   if ( typeof( user_data.first_name ) != 'string' || user_data.first_name.trim().length <= 0 ) {
      return callback(400, { 'Error' : 'First name is required'});
   }

   if ( typeof( user_data.last_name ) != 'string' || user_data.last_name.trim().length <= 0 ) {
      return callback(400, { 'Error' : 'Last name is required'});
   }

   if ( typeof( user_data.password ) != 'string' || user_data.password.trim().length <= 0 ) {
      return callback(400, { 'Error' : 'Password is required'});
   }

   if ( typeof( user_data.phone ) != 'string' || user_data.phone.trim().length != 10 ) {
      return callback(400, { 'Error' : 'Please fill correct phone'});
   }

   if ( typeof( user_data.tos_agreement ) != 'boolean' || user_data.tos_agreement != true ) {
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
      return callback(500, { 'Error' : 'Could not hash the user password'});
   }

   // Make sure that the user doesn't already exist
   data_manager.read( 'users', user_data.phone, function( error, data ) {
      if ( !error ) {
         return callback(400, { 'Error' : 'A user with that phone number already exits'});
      }

      data_manager.create( 'users', user_data.phone, user_data, function( error ) {
         if ( error ) {
            return callback(500, { 'Error' : 'Could not create the new user'});
         }

         callback(200);
      });
   });
};

// Get
// Required data: phone
// Optional data: none
users.get = function( data, callback ) {
   if ( typeof( data.query.phone ) != 'string' || data.query.phone.trim().length != 10 ) {
      return callback(400, { 'Error' : 'Missing required field - phone'});
   }

   verifyToken( data.headers, data.query.phone, function( valid, message ) {
      if ( !valid ) {
         return callback( 403, {"Error" : message} );
      }
      data_manager.read( 'users', data.query.phone, function( error, data ) {
         if ( error || !data ) {
            return callback(404);
         }

         // Removed hashed password and created date from the user object before returning the request
         delete data.password;
         delete data.created_time;

         callback(200, data);
      });
   });
};

// Put
// Required data: phone
// Optional data: first_name, last_name, password
users.put = function( data, callback ) {
   const user_data = helpers.getAllowedData( data.payload, users.allowed_properties );

   // Check for the required fields
   if ( typeof( user_data.phone ) != 'string' || user_data.phone.trim().length != 10 ) {
      return callback(400, { 'Error' : 'Missing required field - phone'});
   }

   // check for the optional fields
   // If there are more than one element (including phone)
   if ( Object.keys( user_data ).length <= 1 ) {
      return callback(400, { 'Error' : 'Missing fields to update'});
   }

   verifyToken( data.headers, user_data.phone, function( valid, message ) {
      if ( !valid ) {
         return callback( 403, {"Error" : message} );
      }

      data_manager.read( 'users', user_data.phone, function( error, data ) {
         if ( error || !data ) {
            return callback(400, { 'Error' : 'The specified user does not exist'});
         }

         data_manager.update( 'users', user_data.phone, { ...data, ...user_data }, function( error ) {
            if ( error ) {
               console.log( error );
               return callback(500, { 'Error' : 'Could not update the user.'});
            }

            callback(200);

         });
      });
   });
};

// Delete
// Required data: phone
// Cleanup old checks associated with the user
users.delete = function( data, callback ) {
   if ( typeof( data.query.phone ) != 'string' || data.query.phone.trim().length != 10 ) {
      return callback(400, { 'Error' : 'Missing required field - phone'});
   }

   verifyToken( data.headers, data.query.phone, function( valid, message ) {
      if ( !valid ) {
         return callback( 403, {"Error" : message} );
      }
      data_manager.read( 'users', data.query.phone, function( error, user_data ) {
         if ( error || !user_data ) {
            return callback(400,{'Error' : 'Could not find the specified user.'});
         }

         data_manager.delete( 'users', data.query.phone, function( error ) {
            if ( error ) {
               return callback(500,{'Error' : 'Could not delete the specified user'});
            }

            const user_checks = typeof(user_data.checks) == 'object' && user_data.checks instanceof Array ? user_data.checks : [];
            const checks_to_delete = user_checks.length - 1;
            const deletion_errors = false;

            if ( checks_to_delete < 0 ) {
               return callback( 200 );
            }

            user_checks.forEach(( check_id, key ) => {
               data_manager.delete( 'checks', check_id, error => {
                  if ( error ) {
                     deletion_errors = true;
                  }

                  if ( key == checks_to_delete && deletion_errors ) {
                     return callback( 500, {'Error' : "Errors encountered while attempting to delete all of the user's checks. All checks may not have been deleted from the system successfully."} );
                  }

                  if ( key == checks_to_delete ) {
                     callback( 200 );
                  }
               });
            });
         });
      });
   });
};

module.exports = users;
