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
   data_name : 'restaurant_menu', 
};

/**
 * Helper promise for single point of loading the restaurant menu
 *
 * @method
 * @private
 */
const getRestaurantObject = new Promise( ( resolve, reject ) => {
   db.read( '', menu.data_name )
      .then( data => {
         menu.data = data;

         resolve( data );
      })
      .catch( reject );
});

menu.getList = function( category ) {
   const categories = menu.data.categories;

   if ( category ) {
      return categories.find( item => item.id == category )['menu-items'];
   }

   return categories.map( item => ({ ...item, 'menu-items' : item['menu-items'].length }));
};

menu.getItem = function( item_id ) {
   const categories = menu.data.categories;
   const find_menu_item =  item => item.id == item_id;

   return categories
      .find(
         list => list['menu-items'].find( find_menu_item )
      )
      ['menu-items'].find( find_menu_item );
}

menu.handlers.menu = function( data, callback ) {
   // Menu list can be only read, so it will allow only get
   if ( data.method !== 'get' ) {
      return callback( 404 );
   }

   getRestaurantObject.then( () => {
      switch ( true ) {
         case !!data.props.item:
            callback( 200, menu.getItem( data.props.item ) );
            break;
         case !!data.props.category:
         default:
            callback( 200, menu.getItem( data.props.category ) );
            break;
      }
   })
   .catch( () => callback( 404 ) );
};

menu.routes = {
   'menu' : menu.handlers.menu,
   'menu/{category}' : menu.handlers.menu,
   'menu/item/{item}' : menu.handlers.menu,
};

// Export the module
module.exports = menu;
