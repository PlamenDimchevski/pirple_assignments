const CODES = {
   FAIL_CREATE_FILE : 1,
   FAIL_WRITING_FILE : 2,
   FAIL_CLOSING_FILE : 3,
   FAIL_READING_FILE : 4,
   FAIL_OPEN_FILE : 5,
   FAIL_TRUNCATING_FILE : 6,
   FAIL_DELETING_FILE : 7,
   FAIL_READING_DIR : 8,
   FAIL_APPEND_FILE : 9,
   FAIL_GZIP_FILE : 10,
   FAIL_UNGZIP_FILE : 11,
   FAIL_PASSWORD_HASH : 12,
};

const ERROR_MESSAGES = {
   [ CODES.FAIL_CREATE_FILE ] : 'Could not create file, it may already exist',

   [ CODES.FAIL_WRITING_FILE ] : 'Error writing to the file',

   [ CODES.FAIL_CLOSING_FILE ] : 'Error closing the file',

   [ CODES.FAIL_READING_FILE ] : 'Error reading the requested file',

   [ CODES.FAIL_OPEN_FILE ] : 'Error opening the requested file',

   [ CODES.FAIL_TRUNCATING_FILE ] : 'Error truncating the requested file',

   [ CODES.FAIL_DELETING_FILE ] : 'Error deleting a file',

   [ CODES.FAIL_READING_DIR ] : 'Unable to read the directory',

   [ CODES.FAIL_APPEND_FILE ] : 'Error appending to file: ',

   [ CODES.FAIL_GZIP_FILE ] : 'Can\'t compress the data using gzip: ',

   [ CODES.FAIL_UNGZIP_FILE ] : 'Can\'t unzip the compress file: ',

   [ CODES.FAIL_PASSWORD_HASH ] : 'Could not hash the user password: ',
};

const MESSAGES = Object.keys( ERROR_MESSAGES ).reduce(
   ( obj, key ) => ({
      ...obj,
      [ key ] : {
         message : `Message: ${ERROR_MESSAGES[ key ]}`,
         code    : key 
      }
   }),
   {}
);

module.exports = {
   ...MESSAGES,
   CODES,
};
