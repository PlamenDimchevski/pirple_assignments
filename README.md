## What does this repository contains?
Here can be found the assignment give as part of the http://pirple.thinkific.com course "The Node.js Master Class".   

## How the Homework Assignment will be split?
Each homework assignment will be as individual branch.
In master will merged the latest assignment.

## Completed Assignment.
#### Homework Assignment #1
   * Present in branch `assignment-1`
   * When request `localhost:3000/hello` will receive `{"message":"Hello World!"}`
   * When request `localhost:3000/hello?name=Plamen` will receive `{"message":"Hello Plamen!"}`
   * When request `localhost:3000/hello` with body/payload contains the following JSON `{"name" : "Earle"}` will receive `{"message":"Hello Earle!"}`
   * If passed both a query parameter and body (for example using tool like postman), it will use the body. The body parameter is with higher priority

#### Homework Assignment #2
##### API listing
API's for updating and managing the data.    
For the API's and the routes in general, a placeholder/wild card option was provided. In each option where in query parameter is required, it can be replaced with cleaner url.    
For more details, see the alias option for given API call.

###### Users module

   * Create user
      * path : `users`
      * method : `post`
      * alias : `none`
      * query : `ignored`
      * body : JSON Object with allowed properties for updating` email, first_name, last_name, password, address, phone, tos_agreement `
      * headers : `none`
      * description : When called with `post` method it will create the user, if the email from the body is not already registered.
      * response :
         * success : 200, { success:true }
         * fail: (400, or 500), { success:false, message:String, error:Object(optional) }
      * example :
         * path
         `localhost:3000/users`
         * method
         `post`
         * body
            ```JSON
            {
               "email" : "test@test.com",
               "first_name" : "John",
               "last_name" : "Doe",
               "password" : "password",
               "address" : "Some address #125",
               "phone" : "0000000000",
               "tos_agreement" : true
            }
            ```
   * Get user
      * path : `users`
      * method : `get`
      * alias : `users/{email}`
      * query : `email=test@test.com`
      * body : `ignored`
      * headers : `token : {token id received from token module}`
      * description : When opening this path with `get` method and pass email as a query property it will return an object with the searched user data.
      * response :
         * success : 200, { success:true, data:Object }
         * fail: (400, or 500), { success:false, message:String, error:Object(optional) }
      * example :
         * path
         `localhost:3000/users?email=test@test.com`
         * with alias
         `localhost:3000/users/test@test.com`
         * method
         `get`
         * headers
         `token : 00000000000000000000000`

   * Update user
      * path : `users`
      * method : `put`
      * alias : `none`
      * query : `ignored`
      * body : JSON Object with allowed properties for updating` email, first_name, last_name, password, address, phone `. Email is required to find the user, but it will not be able to be change.
      * headers : `token : {token id received from token module}`
      * description : When opening the path with `put` it will updated the user
      * response :
         * success : 200, { success:true }
         * fail: (400, or 500), { success:false, message:String, error:Object(optional) }
      * example :
         * path
         `localhost:3000/users`
         * method
         `put`
         * headers
         `token : 00000000000000000000000`
         * body
            ```JSON
            {
               "email" : "test@test.com",
               "first_name" : "John",
               "last_name" : "Doe",
               "password" : "password",
               "address" : "Some address #125",
               "phone" : "0000000000"
            }
            ```
   * Delete user
      * path : `users`
      * method : `delete`
      * alias : `none`
      * query : `email=test@test.com`
      * body : `ignored`
      * headers : `token : {token id received from token module}`
      * description : When opening this path with `delete` method and pass email as a query property it will delete the searched user data and everything related to it.
      * response :
         * success : 200, { success:true }
         * fail: (400, or 500), { success:false, message:String, error:Object(optional) }
      * example :
         * path
         `localhost:3000/users?email=test@test.com`
         * method
         `delete`
         * with alias
         `localhost:3000/users/test@test.com`
         * headers
         `token : 00000000000000000000000`

###### Tokens module

   * Create token
      * path : `token`
      * method : `post`
      * alias : `none`
      * query : `ignored`
      * body : JSON Object with allowed properties for updating` email, password `
      * headers : `none`
      * description : When called with `post` method it will create new token for given user and return the token object.
      * response :
         * success : 200, { success:true, data:Object }
         * fail: (400, or 500), { success:false, message:String, error:Object(optional) }
      * example :
         * path
         `localhost:3000/token`
         * method
         `post`
         * body
            ```JSON
            {
               "email" : "test@test.com",
               "password" : "password"
            }
            ```
   * Get token
      * path : `token`
      * method : `get`
      * alias : `token/{id}`
      * query : `id=00000000000000000000000`
      * body : `ignored`
      * headers : `none`
      * description : When opening this path with `get` method and pass id as a query property it will return an object with the searched token data.
      * response :
         * success : 200, { success:true, data:Object }
         * fail: (400, or 500), { success:false, message:String, error:Object(optional) }
      * example :
         * path
         `localhost:3000/token?id=00000000000000000000000`
         * with alias
         `localhost:3000/token/00000000000000000000000`
         * method
         `get`

   * Update token
      * path : `token`
      * method : `put`
      * alias : `none`
      * query : `ignored`
      * body : JSON Object with allowed properties for updating` extend, id `
      * headers : `none`
      * description : When opening the path with `put` it will updated the expiration time of the token.
      * response :
         * success : 200, { success:true }
         * fail: (400, or 500), { success:false, message:String, error:Object(optional) }
      * example :
         * path
         `localhost:3000/token`
         * method
         `put`
         * body
            ```JSON
            {
               "id" : "00000000000000000000000",
               "extend" : true
            }
            ```
   * Delete token
      * path : `token`
      * method : `delete`
      * alias : `token/00000000000000000000000`
      * query : `id=00000000000000000000000`
      * body : `ignored`
      * headers : `none`
      * description : When opening this path with `delete` method and pass id as a query property it will delete the searched token data.
      * response :
         * success : 200, { success:true }
         * fail: (400, or 500), { success:false, message:String, error:Object(optional) }
      * example :
         * path
         `localhost:3000/token?id=00000000000000000000000`
         * method
         `delete`
         * with alias
         `localhost:3000/token/00000000000000000000000`





* * *
PS. English is not my native and I didn't check for spelling errors in code comments and `.md` files, so have a nice laugh if you find stupid mistakes :)
