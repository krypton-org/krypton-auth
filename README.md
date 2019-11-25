[![Actions Status](https://github.com/JohannC/GraphQL-Auth-Service/workflows/Node%20CI/badge.svg)](https://github.com/JohannC/GraphQL-Auth-Service/actions)
[![Coverage Status](https://coveralls.io/repos/github/JohannC/GraphQL-Auth-Service/badge.svg?branch=master)](https://coveralls.io/github/JohannC/GraphQL-Auth-Service?branch=master)

[![GraphQL Auth Service - Banner](https://nusid.net/img/graphql-auth-service-banner.svg)](#)

A GraphQL API to handle login, registration, access control and password recovery with JsonWebToken. It is easily customizable to your own user data.

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
    //Only if you have don't have local MongoDB instance running on mongodb://localhost:27017
    dbOptions = {
        address: 'user:password@host.com', //Mongo adress, 'localhost' by default
        port: '27017', //Mongo port, '27017' by default 
        agendaDB: 'agenda', //DB name for the email processing queue, 'agenda' by default
        userDB: 'users' //DB name where will be stored the users, 'users' by default
    }
};

const app = GraphQLAuthService(options); //Return an ExpressJS App

app.listen(process.env.PORT || 5000, (err) => {
    if (err)  return console.log('Something bad happened')
    console.log(`GraphQL Auth Service is listening on ${process.env.PORT || 5000}`)
})
```

You can provide the pair of Public and Private Keys or the path to the files containing them. If not, the system will generate a pair for you ([you can retrieve them after]()). There are plenty of other options that let you customize almost everything, from the user model to the email templates. Please read the category [Properties](/#Properties).

## The GraphQL API

Under construction. Release in a few days! :)

## Properties

Under construction. Release in a few days! :)
