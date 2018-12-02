/**
 *
 * Library for storing and editing data
 */

// Dependencies
const fs = require('fs');
const config = require('./config');

// Container for the module (to be exported)
const lib = {};

// Write file to a file
lib.create = function ( dir, file, data, callback ) {
   // Open the file for writing
   fs.open(`${config.data_dir}${dir}/${file}.json`, 'wx', function( error, file_descriptor ) {
      if ( error || !file_descriptor ) {
         return callback('Could not create new file, it may already exist');
      }

      // Convert data to string
      const string_data = JSON.stringify( data );

      // Write a file and close it
      fs.writeFile( file_descriptor, string_data, function( error ) {
         if ( error ) {
            return callback('Error writing to new file');
         }

         fs.close( file_descriptor, function( error ) {
            if ( error ) {
               return callback('Error closing new file');
            }

            callback(false);
         });
      });
   });
};

// Read data from a file
lib.read = function ( dir, file, callback ) {
   fs.readFile(`${config.data_dir}${dir}/${file}.json`, 'utf8', function( error, data ) {
      callback( error, data );
   });
};

// Update data inside a file
lib.update = function ( dir, file, data, callback ) {
   // Open the file for writing
   fs.open(`${config.data_dir}${dir}/${file}.json`, 'r+', function( error, file_descriptor ) {
      if ( error ) {
         return callback('Could not open the file for editing, it may not exist yes');
      }

      // Convert data to string
      const string_data = JSON.stringify( data );

      // Truncate the file
      fs.truncate( file_descriptor, function( error ) {
         if ( error ) {
            return callback('Error truncating file');
         }

         // Write the file and close it.
         fs.writeFile( file_descriptor, string_data, function( error ) {
            if ( error ) {
               return callback(' Error writing to existing file');
            }

            fs.close( file_descriptor, function( error ) {
               if ( error ) {
                  return callback('Error closing existing file');
               }

               callback(false);
            });
         });
      });
   });
};

// Delete file
lib.delete = function ( dir, file, callback ) {
   // Unlink the file
   fs.unlink(`${config.data_dir}${dir}/${file}.json`, function( error ) {
      if ( error ) {
         return callback('Error deleting a file');
      }

      callback(false);
   });
};


// Export the module
module.exports = lib;
