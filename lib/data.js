/**
 *
 * Library for storing and editing data
 */

// Dependencies
const fs = require('fs');
const config = require('./config');
const helpers = require('./helpers');

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
      if ( error || !data ) {
         return callback( error, data );
      }

      callback( false, helpers.parseJsonToObject( data ) || {} );
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

// List all the items in a directory
lib.list = function(dir,callback){
   fs.readdir(`${config.data_dir}${dir}/`, function(err,data){

      if(!err && data && data.length > 0){
         var trimmedFileNames = [];
         data.forEach(function(fileName){
            if (/,json$/.test( fileName )) {
               trimmedFileNames.push(fileName.replace('.json',''));
            }
         });
         callback(false,trimmedFileNames);
      } else {
         callback(err,data);
      }
   });
};

// Export the module
module.exports = lib;
