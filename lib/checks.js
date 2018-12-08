/**
 *
 * Tokens manager
 */

// Dependencies
const data_manager = require('./data');
const helpers = require('./helpers');
const { verifyToken } = require('./tokens');

const checks = {};

checks.allowed_properties = [ 'id', 'user_phone', 'protocol', 'url', 'method', 'success_codes', 'timeout_seconds' ];

// Post
// Required data: protocol, url, method, sucess_code, timeout_seconds
// Optional data: none
checks.post = function( data, callback ) {
   const post_data = helpers.getAllowedData( data.payload, checks.allowed_properties );

   if ( typeof( post_data.protocol ) != 'string' || !['https','http'].includes( post_data.protocol ) ) {
      return callback(400, { 'Error' : 'Protocol is required'});
   }

   if ( typeof( post_data.url ) != 'string' || post_data.url.length < 0 ) {
      return callback(400, { 'Error' : 'URL is required'});
   }

   if ( typeof( post_data.method ) != 'string' || !['post','get','put','delete'].includes( post_data.method ) ) {
      return callback(400, { 'Error' : 'Method is required'});
   }

   if ( typeof( post_data.success_codes ) != 'object' || !( post_data.success_codes instanceof Array ) || post_data.success_codes.length < 0 ) {
      return callback(400, { 'Error' : 'Success codes list is required'});
   }

   if ( typeof( post_data.timeout_seconds ) != 'number' || post_data.timeout_seconds % 1 !== 0  ||  post_data.timeout_seconds < 1 || post_data.timeout_seconds > 5) {
      return callback(400, { 'Error' : 'Timeout_seconds is required'});
   }

   // Get token from headers
   var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

   data_manager.read( 'tokens', token, function ( error, token_data ) {
      if ( error || !token_data ) {
         return callback( 403 );
      }

      var user_phone = token_data.phone;

      data_manager.read( 'users', user_phone, function( error, user_data ) {
         if ( error || !user_data ) {
            return callback( 403 );
         }

         var user_checks = typeof(user_data.checks) == 'object' && user_data.checks instanceof Array ? user_data.checks : [];

         if ( user_checks.length > config.max_checs ) {
            return callback( 400, {'Error' : `The user already has the maximum number of checks (${config.max_checs}).`});
         }

         // Create check object including userPhone
         var check_object = {
            'id' : helpers.createRandomString( 10 ) + Date.now(),
            'user_phone' : user_phone,
            'protocol' : post_data.protocol,
            'url' : post_data.url,
            'method' : post_data.method,
            'success_codes' : post_data.success_codes,
            'timeout_seconds' : post_data.timeout_seconds
         };

         // Save the object
         data_manager.create( 'checks', check_object.id, check_object, function( error ) {
            if ( error ) {
               return callback( 500, {'Error' : 'Could not create the new check'} );
            }

            // Add check id to the user's object
            user_data.checks = user_checks.concat( check_object.id );

            // Save the new user data
            data_manager.update( 'users', user_phone, user_data, function( error ) {
               if ( error ) {
                  return callback( 500, {'Error' : 'Could not update the user with the new check.'} );
               }

               // Return the data about the new check
               callback( 200, check_object );
            });
         });
      });
   });
};

// get
// Required data: id
// Optional data : none
checks.get = function( data, callback ) {
   if ( typeof(data.query.id) !== 'string' && data.query.id.trim().length !== 23 ) {
      return callback( 400, {'Error' : 'Missing required field, or field invalid'} );
   }

   const id = data.query.id.trim();
   data_manager.read( 'checks', id, function( error, check_data ) {
      if ( error || !check_data ) {
         return callback( 404 );
      }

      verifyToken( data.headers, check_data.user_phone, function( valid, message ) {
         if ( !valid ) {
            return callback( 403, {"Error" : message} );
         }

         callback( 200, check_data );
      });
   });
};

// Put
// Required data: id
// Optional data: none
checks.put = function( data, callback ) {
   const put_data = helpers.getAllowedData( data.payload, checks.allowed_properties );
   const update_data = {};

   // Check for required field
   if ( typeof( put_data.id ) != 'string' || put_data.id.length !== 23 ) {
      return callback(400, { 'Error' : 'Protocol is required'});
   }

   // Check for optional fields
   if ( typeof( put_data.protocol ) == 'string' && ['https','http'].includes( put_data.protocol ) ) {
      update_data[ 'protocol' ] = put_data.protocol;
   }

   if ( typeof( put_data.url ) == 'string' && put_data.url.length > 0 ) {
      update_data[ 'url' ] = put_data.url;
   }

   if ( typeof( put_data.method ) == 'string' && ['post','get','put','delete'].includes( put_data.method ) ) {
      update_data[ 'method' ] = put_data.method;
   }

   if ( typeof( put_data.success_codes ) == 'object' && put_data.success_codes instanceof Array  && put_data.success_codes.length > 0 ) {
      update_data[ 'success_codes' ] = put_data.success_codes;
   }

   if ( typeof( put_data.timeout_seconds ) == 'number' && put_data.timeout_seconds % 1 == 0 &&  put_data.timeout_seconds >= 1 && put_data.timeout_seconds <= 5) {
      update_data[ 'timeout_seconds' ] = put_data.timeout_seconds;
   }


   if ( Object.keys( update_data ).length < 1 ) {
      return callback( 400, {'Error' : 'Missing fields to update.'} );
   }

   data_manager.read( 'checks', put_data.id, function( error, check_data ) {
      if ( error || !check_data ) {
         return callback(400,{'Error' : 'Check ID did not exist.'});
      }

      verifyToken( data.headers, check_data.user_phone, function( valid, message ) {
         if ( !valid ) {
            return callback( 403, {"Error" : message} );
         }

         check_data = { ...check_data, ...update_data };

         data_manager.update( 'checks', put_data.id, check_data, function( error ) {
            if ( error ) {
               return callback( 500, {'Error' : 'Could not update the check.'} );
            }

            callback(200);
         });
      });
   });
};

// delete 
// Required data: id
// Optional data: none
checks.delete = function( data, callback ) {
   // Check that id is valid
   var id = typeof(data.query.id) == 'string' && data.query.id.trim().length == 20 ? data.query.id.trim() : false;

   if ( !id ) {
      return callback( 400, {'Error' : 'Missing valid id'} );
   }

   data_manager.read( 'checks', id, function( error, check_data ) {
      if ( error || !check_data ) {
         return callback( 400, {"Error" : "The check ID specified could not be found"} );
      }

      verifyToken( data.headers, check_data.user_phone, function( valid, message ) {
         if ( !valid ) {
            return callback( 403, {"Error" : message} );
         }

         data_manager.delete( 'checks', id, function( error ) {
            if ( error ) {
               return callback( 500, {"Error" : "Could not delete the check data."} );
            }

            data_manager.read( 'users', check_data.user_phone, function( error, user_data ) {
               if ( error || !user_data ) {
                  return callback( 500, {"Error" : "Could not find the user who created the check, so could not remove the check from the list of checks on their user object."} );
               }

               var user_checks = typeof(user_data.checks) == 'object' && user_data.checks instanceof Array ? user_data.checks : [];

               // Remove the deleted check from their list of checks
               var check_position = user_checks.indexOf( id );
               if ( check_position < 0 ) {
                  return callback( 500, {"Error" : "Could not find the check on the user's object, so could not remove it."} );
               }

               user_checks.splice( check_position, 1 );
               user_data.checks = user_checks;
               data_manager.update( 'users', check_data.user_phone, user_data, function( error ) {
                  if ( error ) {
                     return callback( 500, {'Error' : 'Could not update the user.'} );
                  }

                  callback(200);
               });
            });
         });
      });
   });
};

module.exports = checks;
