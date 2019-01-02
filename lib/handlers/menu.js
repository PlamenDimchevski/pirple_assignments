/**
 *
 * Request Handlers
 */

// Dependencies
const db = require('./../data/db');

// Define the menu object
const menu = {
   data : {},
   handlers : {},
   data_name : 'menu', 
};

/**
 * Helper promise for single point of loading the restaurant menu
 *
 * @method
 * @private
 */
menu.getRestaurantObject = new Promise( ( resolve, reject ) => {
   db.read( '', menu.data_name )
      .then( data => {
         menu.data = data;

         resolve( data );
      })
      .catch( reject );
});

/**
 *
 * @method menu
 * @private
 *
 * @param  {Object}   data
 * @param  {Function} callback
 *
 * @return {void}
 */
menu.handlers.menu = function( data, callback ) {
   // Menu list can be only read, so it will allow only get
   if ( data.method !== 'get' ) {
      return callback( 404 );
   }

   menu.getRestaurantObject.then( () => {
      switch ( true ) {
         case !!data.props.item:
            callback( 200, menu.data.items.find( item => item.id == data.props.item || item.alias == data.props.item ) );
            break;
         case data.path == 'menu/categories':
            callback( 200, menu.data.categories );
            break;
         case !!data.props.category:
            callback( 200, menu.data.categories.find( item => item.id == data.props.category || item.alias == data.props.category ) );
            break;
         default:
            callback( 200, menu.data.items );
            break;
      }
   })
   .catch( () => callback( 404 ) );
};

/**
 * Definition for the menu routs.
 * The routes module will search for this sub object `routes` in the menu module to include them as possible routs
 *
 * @type {Object}
 */
menu.routes = {
   'menu' : menu.handlers.menu,
   'menu/categories' : menu.handlers.menu,
   'menu/category/{category}' : menu.handlers.menu,
   'menu/item/{item}' : menu.handlers.menu,
};

// Export the module
module.exports = menu;
