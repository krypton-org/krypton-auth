[![Actions Status](https://github.com/JohannC/GraphQL-Auth-Service/workflows/Node%20CI/badge.svg)](https://github.com/JohannC/GraphQL-Auth-Service/actions)
[![Coverage Status](https://coveralls.io/repos/github/JohannC/GraphQL-Auth-Service/badge.svg?branch=master)](https://coveralls.io/github/JohannC/GraphQL-Auth-Service?branch=master)

[![GraphQL Auth Service - Banner](https://nusid.net/img/graphql-auth-service-banner.svg)](#)

A GraphQL API to handle login, registration, access control and password recovery with JsonWebToken. It is easily customizable to your own user data. [Try the live demo](https://graphql-auth-service.herokuapp.com/graphql).

## Features
  * Registration
  * Login
  * Email verification
  * Password recovery
  * Account modification
  * Account deletion
  * API to fetch user public info

## How does it work?

This authentication system works with a pair of Private and Public Keys:
1. When a user will log-in, GraphQL Auth Service will generate a token from the Private Key (with jsonwebtoken). This token will encode the user data.
2. The user will then be able to make authenticated requests to other servers by including the token into the request headers. Those servers will try to decode the token with the Public Key and access the user data. If the decoding works, it means that only the Private Key could encode the token and it guarantees the user's identity.

Below the corresponding sequence diagram:

<p align="center">
  <img src="https://nusid.net/img/sequence_diagram-graphql_auth_service.svg" alt="GraphQL Auth Service - Sequence diagram" />
</p>

This library aims to be replicated behind a load balancer. It is completely stateless (no session stored). All your replicas would have to be sharing the same pair of Private and Public Keys.

Below a possible system design you could use:

<p align="center">
  <img src="https://nusid.net/img/system_design_diagram-graphql_auth_service.svg" alt="GraphQL Auth Service - System Design diagram"/>
</p>

## Installation

This is an [ExpressJS](https://expressjs.com/) app working with [Node.js](https://nodejs.org/en/) and [MongoDB](https://www.mongodb.com/). You need to provide a [Nodemailer](https://nodemailer.com) configuration from where the system will send administration emails to users. You also need to configure the connection to [MongoDB](https://www.mongodb.com/). If you don't provide any it will try to connect to your local [MongoDB](https://www.mongodb.com/) instance on 'mongodb://localhost:27017/users'.

```bash
npm install graphql-auth-service --save
# or
yarn add graphql-auth-service
```
```javascript
const GraphQLAuthService = require('graphql-auth-service')
const express = require('express');

const app = express(); // Create an express app

const options = {
    //Mandatory
    emailConfig: {
       {
        from: 'myemail@myhost.com', //email address
        host: 'smtp.myhost.com', //hostname 
        secureConnection: true, //use SSL 
        port: 465, //port for secure SMTP 
        auth: {
            user: 'username', //email login
            pass: 'mypassword' //email password
        }
    },
    //Only if you have don't have a local MongoDB instance running on mongodb://localhost:27017
    dbConfig: {
        address: 'user:password@host.com', //Mongo adress, 'localhost' by default
        port: '27017', //Mongo port, '27017' by default 
        agendaDB: 'agenda', //DB name for the email processing queue, 'agenda' by default
        userDB: 'users' //DB name where will be stored the users, 'users' by default
    }
};

GraphQLAuthService(app, options); //Mount GraphQL Auth Service

app.listen(process.env.PORT || 5000, (err) => {
    if (err)  return console.log('Something bad happened')
    console.log(`GraphQL Auth Service is listening on ${process.env.PORT || 5000}`)
})
```

You can provide the pair of Public and Private Keys or the path to the files containing them. If not, the system will generate a pair for you ([you can retrieve them after]()). There are plenty of other options that let you customize almost everything, from the user model to the email templates. Please read the category [Properties](/#Properties).

## The GraphQL API

### Register
```js
fetch(yourURL+'/graphql', {
  method: 'post',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: `mutation{
      register(fields:{username:"yourname", email: "your@mail.com" password:"yourpassword"}){
        notifications{
          type
          message
        }
      }
}`}),})
.then(response => response.json())
.then(res => console.log(res));
```
### Login
Once logged-in, store the token in the local storage of your app. You will be able to access private mutations/queries by including it in the `Authorization` header of the request.
```js
fetch(yourURL+'/graphql', {
  method: 'post',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: `mutation{
      login(login: "your@mail.com", password:"yourpassword"){
        token
      }
}`}),})
.then(response => response.json())
.then(res => localStorage.token = res.data.login.token);
```
### Get the Public Key
```js
fetch(yourURL+'/graphql', {
  method: 'post',
  headers: {
	'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: `query{
      publicKey{
        value
      }
}`}),})
.then(response => response.json())
.then(res => console.log(res));
```
### Update user information
To access this mutation you need to include the bearer token in the `Authorization` header of the request. Then you can update the user token
```js
//Include 'Authorization' 
fetch(yourURL+'/graphql', {
  method: 'post',
  headers: {
	'Content-Type': 'application/json',
	'Authorization': 'Bearer '+localStorage.token
  },
  body: JSON.stringify({
    query: `mutation{
      updateMe(fields:{username:"newusername"}){
        token
        notifications{
          message
        }
      }
}`}),})
.then(response => response.json())
.then(res => localStorage.token = res.data.updateMe.token);
```

### Change password
```js
fetch(yourURL+'/graphql', {
  method: 'post',
  headers: {
	'Content-Type': 'application/json',
	'Authorization': 'Bearer '+localStorage.token
  },
  body: JSON.stringify({
    query: `mutation{
      updateMe(fields:{previousPassword:"yourpassword", password:"newpassword"}){
        notifications{
          message
        }
      }
}`}),})
.then(response => response.json())
.then(res => console.log(res));
```

### Resend verification email
```js
fetch(yourURL+'/graphql', {
  method: 'post',
  headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+localStorage.token
  },
  body: JSON.stringify({
    query: `query{
      sendVerificationEmail{
        notifications{
          message
        }
      }
}`}),})
.then(response => response.json())
.then(res => console.log(res));
```

### Reset forgotten password
```js
fetch(yourURL+'/graphql', {
  method: 'post',
  headers: {
        'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: `query{
      sendPasswordRecorevyEmail(email:"your@mail.com"){
        notifications{
          message
        }
      }
}`}),})
.then(response => response.json())
.then(res => console.log(res));
```

### Delete Account
```js
fetch(yourURL+'/graphql', {
  method: 'post',
  headers: {
        'Content-Type': 'application/json',
    'Authorization': 'Bearer '+localStorage.token
  },
  body: JSON.stringify({
    query: `mutation{
      deleteMe(password:"yourpassword"){
        notifications{
          message
        }
      }
}`}),})
.then(response => response.json())
.then(res => console.log(res));
```

### Fetch public user data
There are many query types to fetch `public` user data. You don't need to be authenticated to perform those queries.
* userById

* userByIds

* userOne

* userMany

* userCount

* userConnection

* userPagination

## Properties

Under construction. Release in a few days! :)
