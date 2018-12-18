/**
 *
 * Library for storing and editing data
 * The module in this file simulate DB manager with methods for CRUD
 */

// Dependencies
const fs = require('fs');
const path = require('path');

const logger  = require('./logger')( 'data_manager' );
const helpers = require('./../helpers');
const config  = require('./../../configs/config');
const errors  = require('./../../configs/errors');

/**
 * 
 * @method resolveJSONPath
 * @private
 *
 * @param  {String}        directory
 * @param  {String}        file_name
 *
 * @return {String}
 */
function resolveJSONPath( directory, file_name ) {
   return path.join(`${config.data_dir}${directory}/${file_name}.json`);
};

// Container for the methods (to be exported)
const lib = {

   /**
    *
    * @method create
    * @public
    * @async
    *
    * @param  {String} dir
    * @param  {String} file_name
    * @param  {Object} data
    *
    * @return {Promise} [description]
    *   @field    { Error message }, { Error }
    *   @success  {undefined}
    */
   create( dir, file_name, data ) {
      const file = resolveJSONPath( dir, file_name );

      return new Promise( ( resolve, reject ) => {

         // Create new file and open it
         fs.open( file, 'wx', ( error, file_descriptor ) => {
            if ( error || !file_descriptor ) {
               logger.debug( errors[ errors.CODES.FAIL_CREATE_FILE ], error );
               return reject( errors.CODES.FAIL_CREATE_FILE, errors[ errors.CODES.FAIL_CREATE_FILE ], error );
            }

            // Convert data to string
            const string_data = JSON.stringify( data );

            // Write a file and close it
            fs.writeFile( file_descriptor, string_data, error => {
               if ( error ) {
                  logger.debug( errors[ errors.CODES.FAIL_WRITING_FILE ], error );
                  return reject( errors.CODES.FAIL_WRITING_FILE, errors[ errors.CODES.FAIL_WRITING_FILE ], error );
               }

               fs.close( file_descriptor, error => {
                  if ( error ) {
                     logger.debug( errors[ errors.CODES.FAIL_CLOSING_FILE ], error );
                     return reject( errors.CODES.FAIL_CLOSING_FILE, errors[ errors.CODES.FAIL_CLOSING_FILE ], error );
                  }

                  resolve();
               });
            });
         });
      });
   },

   /**
    *
    * @method read
    * @public
    * @async
    *
    * @param  {String} dir
    * @param  {String} file_name
    *
    * @return {Promise}
    *   @field    { Error message }, { Error }
    *   @success  {Object}
    */
   read( dir, file_name ) {
      const file = resolveJSONPath( dir, file_name );

      return new Promise( ( resolve, reject ) => {

         fs.readFile( file, 'utf8', ( error, data ) => {
            if ( error ) {
               logger.debug( errors[ errors.CODES.FAIL_READING_FILE ], error );
               return reject( errors.CODES.FAIL_READING_FILE, errors[ errors.CODES.FAIL_READING_FILE ], error );
            }

            resolve( helpers.parseJsonToObject( data ) );
         });
      });
   },

   /**
    *
    * @method update
    * @public
    * @async
    *
    * @param  {String} dir
    * @param  {String} file_name
    * @param  {Object} data
    *
    * @return {Promise}
    *   @field    { Error message }, { Error }
    *   @success  {undefined}
    */
   update( dir, file_name, data ) {
      const file = resolveJSONPath( dir, file_name );

      return new Promise( ( resolve, reject ) => {
         fs.open( file, 'r+', ( error, file_descriptor ) => {
            if ( error || !file_descriptor ) {
               logger.debug( errors[ errors.CODES.FAIL_OPEN_FILE ], error );
               return reject( errors.CODES.FAIL_OPEN_FILE, errors[ errors.CODES.FAIL_OPEN_FILE ], error );
            }

            // Convert data to string
            const string_data = JSON.stringify( data );

            // Truncate the file
            fs.truncate( file_descriptor, error => {
               if ( error ) {
                  logger.debug( errors[ errors.CODES.FAIL_TRUNCATING_FILE ], error );
                  return reject( errors.CODES.FAIL_TRUNCATING_FILE, errors[ errors.CODES.FAIL_TRUNCATING_FILE ], error );
               }

               // Write the file and close it.
               fs.writeFile( file_descriptor, string_data, error => {
                  if ( error ) {
                     logger.debug( errors[ errors.CODES.FAIL_WRITING_FILE ], error );
                     return reject( errors.CODES.FAIL_WRITING_FILE, errors[ errors.CODES.FAIL_WRITING_FILE ], error );
                  }

                  fs.close( file_descriptor, error => {
                     if ( error ) {
                        logger.debug( errors[ errors.CODES.FAIL_CLOSING_FILE ], error );
                        return reject( errors.CODES.FAIL_CLOSING_FILE, errors[ errors.CODES.FAIL_CLOSING_FILE ], error );
                     }

                     resolve();
                  });
               });
            });
         });
      });
   },

   /**
    *
    * @method delete
    * @public
    * @async
    *
    * @param  {String} dir
    * @param  {String} file_name
    *
    * @return {Promise}
    *   @field    { Error message }, { Error }
    *   @success  {undefined}
    */
   delete( dir, file_name ) {
      const file = resolveJSONPath( dir, file_name );

      return new Promise( ( resolve, reject ) => {
         // Unlink the file
         fs.unlink( file, error => {
            if ( error ) {
               logger.debug( errors[ errors.CODES.FAIL_DELETING_FILE ], error );
               return reject( errors.CODES.FAIL_DELETING_FILE, errors[ errors.CODES.FAIL_DELETING_FILE ], error );
            }

            resolve();
         });
      });
   },

   /**
    *
    * @method list
    * @public
    * @async
    *
    * @param  {String} dir
    *
    * @return {Promise}
    *   @field    { Error message }, { Error }
    *   @success  {Array}
    */
   list( dir ) {
      const directory = path.join(`${config.data_dir}${dir}`);
      const json_regex = /\.json$/;

      return new Promise( ( resolve, reject ) => {
         fs.readdir( directory, ( error, data ) => {
            if ( error ) {
               logger.debug( errors[ errors.CODES.FAIL_READING_DIR ], error );
               return reject( errors.CODES.FAIL_READING_DIR, errors[ errors.CODES.FAIL_READING_DIR ], error );
            }

            resolve(
               ( data || [] )
                  .filter( file => json_regex.test( file ) )
                  .map( file => file.replace( json_regex, '' ) )
            );
         });
      });
   },
};

// Export the module
module.exports = lib;
