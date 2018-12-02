## Self assign certificate creation details

### How was created?
* Created under Mac OS X
* Created with the following command `openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem`
* Answers to the creation question 
```
-----
Country Name (2 letter code) []:BG
State or Province Name (full name) []:Sofia
Locality Name (eg, city) []:Sofia
Organization Name (eg, company) []:none
Organizational Unit Name (eg, section) []:none
Common Name (eg, fully qualified host name) []:localhost
Email Address []:test@test.com
```
