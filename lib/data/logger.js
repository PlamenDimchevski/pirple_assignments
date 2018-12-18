/**
 *
 * Logging manager
 */

// Dependencies
const fs   = require('fs');
const util = require('util');
const zlib = require('zlib');

const helpers = require('../helpers');
const config  = require('./../../configs/config');
const errors  = require('./../../configs/errors');

/**
 * Instantiate the logger helper object
 * This object will be kept private, to prevent outside modules to access directly the log files managers
 *
 * @type {Object}
 */
const logger = {

   /**
    *
    * @method append
    * @private
    * @async
    *
    * @param  {String} file
    * @param  {String} string
    *
    * @return {Promise}
    *   @field    { Error message }, { Error }
    *   @success  {undefined}
    */
   append( file, string ) {
      return new Promise( ( resolve, reject ) => {

         fs.open( `${config.logs_dir}${file}.log`, 'a', ( error, file_descriptor ) => {
            if ( error || !file_descriptor ) {
               return reject( errors[ errors.CODES.FAIL_OPEN_FILE ], error );
            }

            fs.appendFile( file_descriptor, `${string}\n`, ( error ) => {
               if ( error ) {
                  return reject( errors[ errors.CODES.FAIL_APPEND_FILE ], error );
               }

               fs.close( file_descriptor, ( error ) => {
                  if ( error ) {
                     return reject( errors[ errors.CODES.FAIL_CLOSING_FILE ], error );
                  }
                  resolve();
               });
            });
         });
      });
   },

   /**
    *
    * @method list
    * @private
    * @async
    *
    * @param  {Boolean} include_compressed_logs
    *
    * @return {Promise}
    *   @field    { Error message }, { Error }
    *   @success  {Array}
    */
   list( include_compressed_logs ) {
      const log_regex = include_compressed_logs ? /\.log$|\.gz\.b64$/ : /\.log$/;

      return new Promise( ( resolve, reject ) => {

         fs.readdir( config.logs_dir, ( error, data ) => {
            if ( error ) {
               return reject( errors[ errors.CODES.FAIL_READING_DIR ], error );
            }

            const list = (data || [])
               .filter( file => log_regex.test( file ) )
               .map( file => file.replace( log_regex, '' ) );

            resolve( list );
         });
      });
   },

   /**
    *
    * @method compress
    * @private
    * @async
    *
    * @param  {String} log_id
    *
    * @return {Promise}
    *   @field    { Error message }, { Error }
    *   @success  {undefined}
    */
   compress( log_id ) {
      const time_stamp = Date.now().toString( 16 ); 
      const source_file = `${config.logs_dir}${log_id}.log`;
      const destination_file = `${config.logs_dir}${log_id}-${time_stamp}.gz.b64`;

      return new Promise( ( resolve, reject ) => {

         fs.readFile( source_file , 'utf8', ( error, input_string ) => {
            if ( error ) {
               return reject( errors[ errors.CODES.FAIL_READING_FILE ], error );
            }

            zlib.gzip( input_string, ( error, buffer ) => {
               if ( error || !buffer ) {
                  return reject( errors[ errors.CODES.FAIL_GZIP_FILE ], error );
               }

               fs.open( destination_file, 'wx', ( error, file_descriptor ) => {
                  if ( error || !file_descriptor ) {
                     return reject( errors[ errors.CODES.FAIL_CREATE_FILE ], error );
                  }

                  fs.writeFile( file_descriptor, buffer.toString('base64'), error => {
                     if ( error ) {
                        return reject( errors[ errors.CODES.FAIL_WRITING_FILE ], error );
                     }

                     fs.close( file_descriptor, error => {
                        if ( error ) {
                           return reject( errors[ errors.CODES.FAIL_CLOSING_FILE ], error );
                        }

                        resolve();
                     });
                  });
               });
            });
         });
      });
   },

   /**
    *
    * @method decompress
    * @private
    * @async
    *
    * @param  {String}   log_id
    *
    * @return {Promise}
    *   @field    { Error message }, { Error }
    *   @success  {String}
    */
   decompress( log_id ) {

      return new Promise( ( resolve, reject ) => {

         fs.readFile( `${config.logs_dir}${log_id}.gz.b64`, 'utf8', ( error, string ) => {
            if ( error ) {
               return reject( errors[ errors.CODES.FAIL_READING_FILE ], error );
            }

            var input_buffer = Buffer.from( string || '', 'base64' );

            zlib.unzip( input_buffer, ( error, output_buffer ) => {
               if ( error ) {
                  return reject( errors[ errors.CODES.FAIL_UNGZIP_FILE ], error );
               }

               resolve( output_buffer || '' );
            });
         });
      });
   },

   /**
    *
    * @method truncate
    * @private
    * @async
    *
    * @param  {String} log_id
    *
    * @return {Promise}
    *   @field    { Error message }, { Error }
    *   @success  {undefined}
    */
   truncate( log_id ) {

      return new Promise( ( resolve, reject ) => {

         fs.truncate( `${config.logs_dir}${log_id}.log`, 0, error => {
            if ( error ) {
               return reject( errors[ errors.CODES.FAIL_TRUNCATING_FILE ], error );
            }

            resolve();
         });
      });
   },
};

// Export the server module object
module.exports = function ( name ) {
   // Require the debuglog module with the correct module
   const debuglog = util.debuglog( name );

   return {

      /**
       *
       * @method compressActiveLogs
       * @public
       *
       * @return {void}
       */
      compressActiveLogs() {
         logger.list( false )
         .then( list => {
            list.forEach( log => {
               const log_id = log.replace(/\.log$/, '');

               logger.compress( log_id )
               .then( () => {
                  return logger.truncate( log_id );
               })
               .then( () => debuglog(`\x1b[33mSuccessful compression and clenap of log ${log_id}\x1b[0m`) )
               .catch( ( message, error ) => console.error(`\x1b[31m${message}\x1b[0m`, error ) )
            });
         })
         .catch( ( message, error ) => console.error(`\x1b[31m${message}\x1b[0m`, error ) );
      },

      /**
       * Each call of this method will be logged in the console, if the NODE_DEBUG contains the given name
       * In addition each call of this method will save the data in a .log file with append 
       *    - instance name
       *    - date and time
       *    - and it will test passed argument if is not a string to stringify it 
       *
       * @method log
       * @public
       *
       * @param  {...Mixed} args Spread out the list of arguments
       *
       * @return {Function} The logging function
       */
      log( suffix, ...args ) {
         const spread = [ '\x1b[100m\x1b[30m Log: \x1b[0m', ...args, ''];
         suffix = suffix ? `-${suffix}` : '';

         logger.append(
            `${name}${suffix}`,
            JSON.stringify({
               module : name,
               time_stamp : Date.now(),
               param : args
            })
         )
         .catch( console.log );
         return debuglog( ...spread ); 
      },

      /**
       * Method for displaying logs in the console, only if the NODE_DEBUG contains the given name
       *
       * @method debug
       * @public
       *
       * @param  {...mixed} args [description]
       *
       * @return {Function} The logging function
       */
      debug( ...args ) {
         const spread = [ '\x1b[104m\x1b[30m Debug: \x1b[0m\x1b[0m', ...args];
         return debuglog( ...spread );
      },

      /**
       * This method does the same action as `log`, with the exceptions that:
       *    - It will print it message to the console regardless to of NODE_DEBUG value
       *    - Each instance will be color in read
       *    - It will save the data to a .log file with suffix `{name}-error.log`
       *
       * @method error
       * @public
       *
       * @param  {...Mixed} args Spread out the list of arguments
       *
       * @return {Function} The logging function
       */
      error( ...args ) {
         const spread = [ `\x1b[31m\x1b[1mError ${name}: \x1b[0m\x1b[31m`, ...args, '\x1b[0m'];

         logger.append(
            `${name}-error`,
            JSON.stringify({
               module : name,
               time_stamp : Date.now(),
               param : args
            })
         )
         .catch( console.log );
         return console.log(...spread);
      },

      /**
       * Method for displaying logs in the console, but colored in yellow
       *
       * @method attention
       * @public
       *
       * @param  {...Mixed} args Spread out the list of arguments
       *
       * @return {Function} The logging function
       */
      attention( ...args ) {
         return console.log(`\x1b[33m${name}: \x1b[0m`, ...args);
      },

      /**
       * Method for displaying logs in the console, but colored in green
       *
       * @method info
       * @public
       *
       * @param  {...Mixed} args Spread out the list of arguments
       *
       * @return {Function} The logging function
       */
      info( ...args ) {
         return console.log(`\x1b[32m${name}: \x1b[0m`, ...args);
      },
   };
};
