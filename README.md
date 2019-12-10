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

To register simply use the `register` mutation. You will have to provide the different `fields` of your user model. *Please refer to the properties section to learn how to customize your user model.*

```js
fetch(serviceURL+'/graphql', {
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
Once registered you will receive an email to verify your account. *This email is customizable, go check the properties section.*

<p align="center">
  <img src="https://raw.githubusercontent.com/JohannC/img/master/graphql_auth_service-verification-email.png" alt="GraphiQL Auth Token - User verification email"/>
</p>


Clicking on the link will lead you to a notification page. *This page is customizable, go check the properties section.*
<p align="center">
  <img src="https://raw.githubusercontent.com/JohannC/img/master/graphql_auth_service-verification-page.png" alt="GraphiQL Auth Token - User verification page"/>
</p>

### Login

To log-in simply use the `login` mutation. You will have to provide the `login` which can be the the email or username of your user account and your `password`. Once logged-in, store the token in the local storage of your app. You will be able to access private mutations/queries by including it in the `Authorization` header of the request as a `Bearer token`.
```js
fetch(serviceURL+'/graphql', {
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
.then(res => res.json())
.then(res => localStorage.token = res.data.login.token);
```
### Get the Public Key
```js
fetch(serviceURL+'/graphql', {
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
.then(res => res.json())
.then(res => console.log(res));
```
### Update user information

To change any of your user fields, use the `updateMe` mutation. You have to be logged in and include your `Bearer token` in the `Authorization` header of your request. If you update your `email` you will receive a verification email like for registration. To change your password, please see in the next section. 

```js
//Include 'Authorization' 
fetch(serviceURL+'/graphql', {
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
.then(res => res.json())
.then(res => localStorage.token = res.data.updateMe.token);
```

### Change password

To change your email use the `updateMe` mutation passing your `previousPassword` and your new desired `password`. You have to be logged in and include your `Bearer token` in the `Authorization` header of your request.

**Note:** By updating your user data, remember to also update the user token stored in the local storage of your client. If you don't, other services decrypting the token with the Public Key would have an outdated version of your data. 

```js
fetch(serviceURL+'/graphql', {
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
.then(res => res.json())
.then(res => console.log(res));
```

### Resend verification email

To resend the verification email use the `sendVerificationEmail` query. You have to be logged in and include your `Bearer token` in the `Authorization` header of your request.

```js
fetch(serviceURL+'/graphql', {
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
.then(res => res.json())
.then(res => console.log(res));
```

### Reset forgotten password

To reset your forgotten password use the `sendPasswordRecorevyEmail` query passing the `email` address of your account.

```js
fetch(serviceURL+'/graphql', {
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
.then(res => res.json())
.then(res => console.log(res));
```

If your email is present in the user database you will receive an email to reset your password. *This email is customizable, go check the properties section.*

<p align="center">
  <img src="https://raw.githubusercontent.com/JohannC/img/master/graphql_auth_service-reset-password-email.png" alt="GraphiQL Auth Token - Reset password email"/>
</p>


Clicking on the link will lead you to a notification page. *This page is customizable, go check the properties section.*
<p align="center">
  <img src="https://raw.githubusercontent.com/JohannC/img/master/graphql_auth_service-reset-password-page.png" alt="GraphiQL Auth Token - Reset password page"/>
</p>


### Delete Account

To delete your account use the `deleteMe` mutation. You have to be logged in and include your `Bearer token` in the `Authorization` header of your request.

```js
fetch(serviceURL+'/graphql', {
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
.then(res => res.json())
.then(res => console.log(res));
```

### Fetch public user data
There are many query types to fetch `public` user data. You don't need to be authenticated to perform those queries. It will retrieve only the user data declared as public in your user model. *Please refer to the properties section to learn how to customize your user model.*

* userById
To fetch user public information from its `id` use use the `userById` query. 
```js
fetch(serviceURL+'/graphql', {
  method: 'post',
  headers: {
        'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: `query{
      userById(_id:"5dexacb7e951cd02cb8d889"){
        username
      }
}`}),})
.then(res => res.json())
.then(res => console.log(res));
```
* userByIds
To fetch user public information from a list of `id`s use use the `userByIds` query.

```js
fetch(serviceURL+'/graphql', {
  method: 'post',
  headers: {
        'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: `query{
      userByIds(_ids:["5deeacb7e9acd02cb8efd889", "5deee11b8938bc27989d63fb"]){
        username
      }
}`}),})
.then(res => res.json())
.then(res => console.log(res));
```

* userOne
To fetch one user public information from any of its public fields use the `userOne` query.
```js
fetch(serviceURL+'/graphql', {
  method: 'post',
  headers: {
        'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: `query{
      userOne(filter:{username:"yourname"}){
        _id
      }
}`}),})
.then(res => res.json())
.then(res => console.log(res));
```

* userMany

* userCount

* userConnection

* userPagination

## Properties

Under construction. Release in a few days! :)
