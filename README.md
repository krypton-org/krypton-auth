[![Actions Status](https://github.com/JohannC/GraphQL-Auth-Service/workflows/Node%20CI/badge.svg)](https://github.com/JohannC/GraphQL-Auth-Service/actions)
[![Coverage Status](https://coveralls.io/repos/github/JohannC/GraphQL-Auth-Service/badge.svg?branch=master)](https://coveralls.io/github/JohannC/GraphQL-Auth-Service?branch=master)

[![GraphQL Auth Service - Banner](https://nusid.net/img/graphql-auth-service-banner.svg)](#)

An authentication middleware for Express handling login, registration, password recovery and account management with GraphQL & JSON Web Tokens. It features [a flexible user data model that you can customize](#extendedschema). [Try the live demo](https://graphql-auth-service.herokuapp.com/graphql). 

*It is kind of a free & open-source alternative to [Firebase Authentication](https://firebase.google.com/products/auth/).*

## Features
  * Registration
  * Login
  * Email verification
  * Password recovery
  * Account modification
  * Account deletion
  * API to fetch public user info
  * [XSS](https://www.owasp.org/index.php/Cross-site_Scripting_(XSS)) and [CSRF](https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF)) protection

## Table of contents
- [Installation](#installation)
- [How does it work?](#how-does-it-work)
- [Security](#security)
- [Performing a GraphQL query](#performing-a-graphql-query)
- [The GraphQL API](#the-graphql-api)
  * [Register](#register)
  * [Login](#login)
  * [Refresh authentication tokens](#refresh-authentication-tokens)
  * [Get the Public Key](#get-the-public-key)
  * [Update user information](#update-user-information)
  * [Change password](#change-password)
  * [Resend verification email](#resend-verification-email)
  * [Reset forgotten password](#reset-forgotten-password)
  * [Delete Account](#delete-account)
  * [Fetch public user data](#fetch-public-user-data)
- [Properties](#properties)
  * [algorithm](#algorithm)
  * [authTokenExpiryTime](#authtokenexpirytime)
  * [dbConfig](#dbconfig)
  * [extendedSchema](#extendedschema)
  * [graphiql](#graphiql)
  * [hasUsername](#hasusername)
  * [host](#host)
  * [mailFrom](#mailfrom)
  * [mailTransporter](#mailtransporter)
  * [notificationPageTemplate](#notificationpagetemplate)
  * [onReady](#onready)
  * [privateKey](#privatekey)
  * [privateKeyFilePath](#privatekeyfilepath)
  * [publicKey](#publickey)
  * [publicKeyFilePath](#publickeyfilepath)
  * [refreshTokenExpiryTime](#refreshtokenexpirytime)
  * [resetPasswordEmailTemplate](#resetpasswordemailtemplate)
  * [resetPasswordFormTemplate](#resetpasswordformtemplate)
  * [verifyEmailTemplate](#verifyemailtemplate)
- [Error handling](#error-handling)
- [Decode auth tokens in other web servers](#decode-auth-tokens-in-other-web-servers)
  * [In JavaScript](#in-javascript)
  * [In Python](#in-python)

## Installation

GraphQL Auth Service is an [ExpressJS Router](https://expressjs.com/en/api.html#router) behaving like middleware itself.

It works with [MongoDB](https://www.mongodb.com/) and you need to [configure its connection](#dbconfig). If you don't provide any, it will try to connect to your local [MongoDB](https://www.mongodb.com/) instance on `mongodb://localhost:27017/`.

In production, you also need to [provide a Nodemailer transporter](#emailConfig) from where will be sent emails to users. If you don't provide any, a nodemailer test account is set automatically. It will print links on the command line to preview the emails that would have normally been sent. 

```bash
npm install graphql-auth-service --save
# or
yarn add graphql-auth-service
```
```javascript
import { GraphQLAuthService } from 'graphql-auth-service';
import express from 'express';

const app = express();

app.use('/auth', GraphQLAuthService()); //API entry point is localhost:5000/auth

app.listen(process.env.PORT || 5000, () => {
    console.log(`server is listening on ${process.env.PORT || 5000}`)
})
```

You can [provide the pair of Public and Private Keys](https://github.com/JohannC/GraphQL-Auth-Service#publickey) or [the path to the files containing them](https://github.com/JohannC/GraphQL-Auth-Service#publickeyfilepath). If not, the system will generate a pair for you ([you can retrieve them after](https://github.com/JohannC/GraphQL-Auth-Service#publickeyfilepath)). There are plenty of other options that let you customize almost everything, from the [user model](https://github.com/JohannC/GraphQL-Auth-Service#extendedschema) to the [email templates](https://github.com/JohannC/GraphQL-Auth-Service#verifyemailtemplate). Please read the [property](https://github.com/JohannC/GraphQL-Auth-Service#properties) section.

## How does it work?

This authentication system works with a pair of Private and Public Keys:
1. When a user logs-in, GraphQL Auth Service generates a token from the Private Key (with JSON Web Tokens). This token will encode the user data.
2. Then, the user is able to make authenticated requests to other servers by including the token into the request headers. Those servers can decode the token with the Public Key and access the user data. If the decoding works, it means that only the Private Key could encode the token and it guarantees the user's identity.

Below the corresponding sequence diagram:

<p align="center">
  <img src="https://nusid.net/img/sequence_diagram-graphql_auth_service.svg" alt="GraphQL Auth Service - Sequence diagram" />
</p>

This library aims to be replicated behind a load balancer. It is completely stateless (no session stored). All your replicas would have to be sharing the same pair of Private and Public Keys.

Below a possible system design you could use:

<p align="center">
  <img src="https://nusid.net/img/system_design_diagram-graphql_auth_service.svg" alt="GraphQL Auth Service - System Design diagram"/>
</p>

## Security

GraphQL Auth Service follows the security guidelines of this article : [The Ultimate Guide to handling JWTs on frontend clients](https://blog.hasura.io/best-practices-of-using-jwt-with-graphql/).

By logging-in a user will receive a short-lived authentication token and a long-lived refresh token. The authentication token should not be saved in the localstorage (prone to [XSS](https://www.owasp.org/index.php/Cross-site_Scripting_(XSS))), but in a variable. The refresh token is set automatically as an HttpOnly cookie (safe from [XSS](https://www.owasp.org/index.php/Cross-site_Scripting_(XSS))). 

By default, the authentication token is valid for 15 minutes. Afterwards you will have to make a call to the [`refreshToken`](#refresh-authentication-tokens) mutation to have a new one. This mutation will use the refresh token set in the HttpOnly cookie to authenticate the user and give back his new authentication token. This refresh token is by default valid for 7 days and allows you to have a persistent session. Note that the refresh token is also refreshed on every call to the [`refreshToken`](#refresh-authentication-tokens) mutation so that an active user never gets disconnected.

<p align="center">
  <img src="https://nusid.net/img/sequence_diagram-security.svg" alt="GraphQL Auth Service - System Design diagram"/>
</p>

This process is safe from [CSRF](https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF)) attacks, because even though a form submit attack can make a call to the [`refreshToken`](#refresh-authentication-tokens) mutation, the attacker cannot get the new JWT token value that is returned.

The only risk left is that by an [XSS](https://www.owasp.org/index.php/Cross-site_Scripting_(XSS)) attack an authentication token gets stolen. The attacker could then make requests with the identity of the hacked user during a period of time up to 15 minutes. That is why to change any user information like the password, email or username with the [`updateMe`](#update-user-information) mutation, the system will check the authentication token and the refresh token. It prevents the attacker from taking over the targeted user account by modifying those fields.

Anyway, you should learn on how to protect your application from [XSS](https://www.owasp.org/index.php/Cross-site_Scripting_(XSS)) attacks to ensure maximum security to your users. Here is a [cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) made by [OWASP](http://owasp.org). Note that GrahQL-Auth-Service is escaping any HTML special character like `<` `>` in the data provided by users (except for passwords which are hashed and never returned to the client).

## Performing a GraphQL query

To use GraphQL Auth Service, you can use the `fetch` method or the `XMLHttpRequest` Object in JavaScript. To make an authenticated request, simply include your authentication token as `Bearer token` in the `Authorization` header of your request. Please refer to this example below:

```js
fetch(yourServiceURL, {
  method: 'post',
  headers: {
    'Content-Type': 'application/json',
    //Include in the Authorization header your authentication token to make an authenticated request
	'Authorization': 'Bearer '+ yourAuthToken
  },
  body: JSON.stringify({
    //GraphQL query
    query: `mutation{
      updateMe(fields:{username:"newusername"}){
        token
        notifications{
          message
        }
      }
}`}),})
.then(res => res.json())
.then(res => console.log(res));
```

You also have access to the GraphiQL IDE (if the property [`graphiql`](https://github.com/JohannC/GraphQL-Auth-Service#graphiql) is not set to `false`). Just open a web browser to `http://api-entry-point/graphql` you will be able to type the graphql queries in the IDE.


## The GraphQL API

### Register

To register simply use the [`register`](#register) mutation. You will have to provide the different `fields` of your user model. *Please refer to the properties section to learn how to customize your user model.*

```js
mutation{
    register(fields:{username:"yourname", email: "your@mail.com" password:"yourpassword"}){
        notifications{
            type
            message
        }
    }
}
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

To log-in simply use the [`login`](#login) mutation. You will have to provide a `login` which can be the email or username of your account and your `password`. It will return your authentication token with its expiry date and set an HttpOnly cookie with a refresh token. Save the authentication token and its expiry date in a variable of your app and not in the localstorage (prone to [XSS](https://www.owasp.org/index.php/Cross-site_Scripting_(XSS))). You will be able to access private mutations/queries by including it in the `Authorization` header of the request as a `Bearer token`. This token will be usable until its expiry date (by default 15 minutes). When outdated refresh it by calling the [`refreshToken`](#refresh-authentication-tokens) mutation.

```js
mutation{
    login(login: "your@mail.com", password:"yourpassword"){
        token
        expiryDate
    }
}
```

### Refresh authentication tokens

By default your authentication token is valid for 15 minutes. To refresh it, use the `refreshToken` mutation. It will send you back a new authentication token and expiry date. You don't need to pass your actual authentication token in the `Authorization` header, it only needs the cookie containing your refresh token **transmitted by default** by your browser. This refresh token will also be refreshed. Thus, unless you stay inactive during a long period of time (by default 7 days), you will never have to log-in again. 

```js
mutation{
    refreshToken{
        expiryDate
        token
    }
}
```
### Get the Public Key

Easily fetch the Public Key of the service with this query in order to [decode the authentication token on your other web servers/apps](#decode-auth-tokens-in-other-web-servers).

```js
query{
    publicKey
}
```
### Update user information

To change any of your user fields, use the `updateMe` mutation. You have to be logged in to perform this request. Simply [include your authentication token as `Bearer token` in the `Authorization` header of your request](https://github.com/JohannC/GraphQL-Auth-Service#performing-a-graphql-query). If you update your `email`, you will receive a verification email like for registration. To change your password, please see in the next section. 

```js
//Include your auth token as 'Bearer token' in the 'Authorization' header of your request
mutation{
    updateMe(fields:{username:"newusername"}){
        token
        notifications{
            message
        }
    }
}
```

**Note:** By updating your user data, remember to refresh your auth token by calling the [`refreshToken`](#refresh-authentication-tokens) mutation. If you don't, other services decrypting the token with the Public Key would have an outdated version of your data.

### Change password

To change your email, use the `updateMe` mutation passing your `previousPassword` and your new desired `password`. You have to be logged in to perform this request. Simply [include your authentication token as `Bearer token` in the `Authorization` header of your request](https://github.com/JohannC/GraphQL-Auth-Service#performing-a-graphql-query). 

```js
//Include your auth token as 'Bearer token' in the 'Authorization' header of your request
mutation{
    updateMe(fields:{previousPassword:"yourpassword", password:"newpassword"}){
        notifications{
            message
        }
    }
}
```

### Resend verification email

To resend the verification email, use the `sendVerificationEmail` query. You have to be logged in to perform this request. Simply [include your authentication token as `Bearer token` in the `Authorization` header of your request](https://github.com/JohannC/GraphQL-Auth-Service#performing-a-graphql-query).

```js
//Include your auth token as 'Bearer token' in the 'Authorization' header of your request
query{
    sendVerificationEmail{
        notifications{
            message
        }
    }
}
```

### Reset forgotten password

To reset your forgotten password, use the `sendPasswordRecorevyEmail` query passing the `email` address of your account.

```js
query{
    sendPasswordRecorevyEmail(email:"your@mail.com"){
        notifications{
            message
        }
    }
}
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

To delete your account, use the `deleteMe` mutation. You have to be logged in to perform this request. Simply [include your authentication token as `Bearer token` in the `Authorization` header of your request](https://github.com/JohannC/GraphQL-Auth-Service#performing-a-graphql-query).

```js
//Include your auth token as 'Bearer token' in the 'Authorization' header of your request
mutation{
    deleteMe(password:"yourpassword"){
        notifications{
            message
        }
    }
}
```

### Fetch public user data
There are many query types to fetch `public` user data. You don't need to be authenticated to perform those queries. It will retrieve only the user data declared as public in your user model. *Please refer to the properties section to learn how to customize your user model.*

* userById
To fetch public user information from its `id` use use the `userById` query. 
```js
query{
    userById(_id:"5dexacb7e951cd02cb8d889"){
        username
    }
}
```
* userByIds
To fetch public user information from a list of `id`s use use the `userByIds` query.

```js
query{
    userByIds(_ids:["5deeacb7e9acd02cb8efd889", "5deee11b8938bc27989d63fb"]){
        username
    }
}
```

* userOne
To fetch one public user information from any of its public fields use the `userOne` query.
```js
query{
    userOne(filter:{username:"yourname"}){
        _id
    }
}
```

* userMany

To fetch one or many user public information from any of its public fields.

* userCount

To count users according to criteria based on any user public fields.

* userPagination

To list users with pagination configuration.

## Properties

### algorithm
`String` property - The algorithm of the JSON Web Token. The default value is `RS256`.

### authTokenExpiryTime

`Number` property - The time until the auth token expires in milliseconds. The default value is `15 * 60 * 1000` (15 minutes). Call the [`refreshToken`](#refresh-authentication-tokens) mutation to renew it.

###  dbConfig
Object property that can contain 4 properties:
* address: `String` property - The address of the MongoDB server. Example: `user:password@host.com`. The default value is `localhost`.
* port: `String` property - The port of the MongoDB server. The default value is `27017`.
* agendaDB: `String` property - The database name for the email processing queue. The default value is `agenda`.
* userDB: `String` property - The user database name. The default value is `users`.

###  extendedSchema

The real power of GraphQL Auth Service is the ability to customize the user model to your own needs. 

To achieve that you simply need to pass the different [Mongoose Schema](https://mongoosejs.com/docs/guide.html) fields you want to add. Under the hood, those extra fields will be converted into GraphQL types thanks to [graphql-compose-mongoose](https://github.com/graphql-compose/graphql-compose-mongoose) and added to the different queries and mutations automatically.

[Mongoose Schema](https://mongoosejs.com/docs/guide.html) is very powerful, you can define the field type, default value, [custom validators](https://mongoosejs.com/docs/validation.html#custom-validators) & error messages to display, if it is [required](https://mongoosejs.com/docs/validation.html#required-validators-on-nested-objects), if it should be [unique](https://mongoosejs.com/docs/validation.html#the-unique-option-is-not-a-validator)... Please refer to its [documentation](https://mongoosejs.com/docs/guide.html).

**!! Note !!** In each schema field, you can define the `isPrivate` attribute. It is a `Boolean` attribute telling whether or not this field can be accessible by public `queries` like [userById](https://github.com/JohannC/GraphQL-Auth-Service#fetch-public-user-data), [userByOne](https://github.com/JohannC/GraphQL-Auth-Service#fetch-public-user-data), etc.

For example, you could pass the following `extendedSchema`:

```js
const extendedSchema = {
    firstName: {
        type: String,
        required: false,
        maxlength: 256,
        validate: {
            validator: v => v.length >= 2,
            message: () => "A minimum of 2 letters are required for your first name!",
        },
        isPublic: false
    },
    lastName: {
        type: String,
        required: false,
        maxlength: 256,
        validate: {
            validator: v => v.length >= 2,
            message: () => "A minimum of 2 letters are required for your last name!",
        },
        isPublic: false
    },
    gender: {
        type: String,
        required: true,
        enum: ["M", "Mrs", "Other"],
        isPublic: true
    },
    age: {
        type: Number,
        required: true,
        isPublic: true,
        min: 0
    },
    receiveNewsletter: {
        type: Boolean,
        required: true,
        default: false,
        isPublic: false
    }
};

app.use(GraphQLAuthService({ extendedSchema }));
```

###  graphiql
`Boolean` property - Enable or disable GraphiQL IDE. The default value is `true`. In the page header, you will find an input field to include your auth token and be able to make authenticated requests.
**!! Note !!** Include your auth token directly, no need to precede it with 'Bearer '.

### hasUsername
`Boolean` property - Enable or disable username. The default value is `true`.

### host
`String` property - Public URL of the service. **!! Very important for use in production!!** When users receive emails to reset their password or to confirm their account, the links will be pointing to the `host` of the service. The default value is `null`. When `null`, GraphQL Auth Service uses the address located in `req.headers.host` that can correspond to the machine `localhost`.

### mailFrom
`String` or `Object` property - Sender address displayed in emails sent to users. The default value is `undefined`.
```js
app.use(GraphQLAuthService({ mailFrom: '"Fred Foo 👻" <foo@example.com>' }));
// OR
app.use(GraphQLAuthService({ 
    mailFrom: {
        name: "Fred Foo 👻";
        address: "foo@example.com";
    }
}));
```
If left `undefined` only the adress provided in [mailTransporter](#mailTransporter) property will be shown.

###  mailTransporter
`Object` property - A [Nodemailer transporter](https://nodemailer.com/smtp/#examples) used to send administration emails to users. Create one by calling `createTransport` from the [Nodemailer API](https://nodemailer.com/smtp/#examples). The default value is `undefined`.

```js
const transporter = nodemailer.createTransport({
    host: "smtp.example.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: credentials.user,
      pass: credentials.pass
    }
});

app.use('/auth', GraphQLAuthService({ transporter }));
```

If left `undefined` a Nodemailer test account is set automatically. It will print URL links on the command line to let you preview the emails that would have normally been sent.

```bash
Message sent: <365ea109-f645-e3a1-5e08-48e4c8a37bcb@JohannC>
Preview URL: https://ethereal.email/message/Xklk07cTigz7mlaKXkllHsRk0gyz7kuxAAAAAWLgnFDcJwUFl8MZ-h1shKs
```

###  notificationPageTemplate
`String` property - The filepath to the [EJS](https://ejs.co/) template file of notification page. This library include a simple one located in [`./nodes_module/graphql-auth-service/lib/templates/pages/Notification.ejs`](https://github.com/JohannC/GraphQL-Auth-Service/blob/master/lib/templates/pages/Notification.ejs). You can create another, just gives the pass to the [EJS](https://ejs.co/) file you wish to send. Here are the locals you can use inside the template:
* `notifications`: `Array` of `Object` notification. Each notification object contains two properties;
    * `type`: `String Enum` either equal to `success` - `warning` - `error` - `info`
    * `message`: `String` property containing the notificaiton message

###  onReady
`Function` property - The callback that will be executed when service is launched and ready. The default value is: `() => console.log("GraphQL Auth Service is ready.");`.

###  privateKey
`String` property - The Private Key of the service. If both privateKey and privateKeyFilePath are undefined, it will create one under `your-app/private-key.txt` all along with the Public Key. You can retrieve the pair of keys created for re-use afterward.

###  privateKeyFilePath
`String` property - The file path to the Private Key of the service. If both privateKey and privateKeyFilePath are undefined, it will create one under `your-app/private-key.txt` all along with the Public Key. You can retrieve the pair of keys created for re-use afterward.

###  publicKey
`String` property - The Public Key of the service. If both publicKey and publicKeyFilePath are undefined, it will create one under `your-app/public-key.txt` all along with the Private Key. You can retrieve the pair of keys created for re-use afterward.

###  publicKeyFilePath
`String` property - The file path to the Public Key of the service. If both publicKey and publicKeyFilePath are undefined, it will create one under `your-app/public-key.txt` all along with the Private Key. You can retrieve the pair of keys created for re-use afterward.

### refreshTokenExpiryTime

`Number` property - The time until the refresh token expires in milliseconds. If a user is inactive during this period he will have to login in order to get a new refresh token. The default value is `7 * 24 * 60 * 60 * 1000` (7 days).

**Note:** before the refresh token has expired, you can call the [`refreshToken`](#refresh-authentication-tokens) mutation. Both the auth token and the refresh token will be renewed and your user won't face any service interruption.

###  resetPasswordEmailTemplate
`String` property - The filepath to the [EJS](https://ejs.co/) template file of the email to reset forgotten password. This library include a simple one located in [`./nodes_module/graphql-auth-service/lib/templates/emails/ResetPassword.ejs`](https://github.com/JohannC/GraphQL-Auth-Service/blob/master/lib/templates/emails/ResetPassword.ejs). You can create another, just gives the pass to the [EJS](https://ejs.co/) file you wish to send. Here are the locals you can use inside the template:
* `user` - The current user: `<p>Hi <%= user.username %></p>`
* `link` - The link to the reset form: `Click here: <a href="<%= link %>"><%= link %>`

###  resetPasswordFormTemplate
`String` property - The filepath to the [EJS](https://ejs.co/) template file of the reset password form. This library include a simple one located in [`./nodes_module/graphql-auth-service/lib/templates/forms/ResetPassword.ejs`](https://github.com/JohannC/GraphQL-Auth-Service/blob/master/lib/templates/forms/ResetPassword.ejs). You can create another, just gives the pass to the [EJS](https://ejs.co/) file you wish to send. Here are the locals you can use inside the template:
* `link`: The link of the API: `xhr.open("POST", '<%= link %>');`
* `token`: The reset password token to include in the GraphQL [`resetMyPassword`](#reset-forgotten-password) mutation (exemple below)

```js
const xhr = new XMLHttpRequest();
xhr.responseType = 'json';
xhr.open("POST", '<%= link %>');
xhr.setRequestHeader("Content-Type", "application/json");
const mutation = {
    query: `mutation{resetMyPassword(password:"${formData.get("password")}" passwordRecoveryToken:<%= token %>){
        notifications{
        type
        message
        }
    }}`
}
xhr.send(JSON.stringify(mutation));
```

###  verifyEmailTemplate
`String` property - The filepath to the [EJS](https://ejs.co/) template file of the email to verify user account. This library include a simple one located in [`./nodes_module/graphql-auth-service/lib/templates/emails/VerifyEmail.ejs`](https://github.com/JohannC/GraphQL-Auth-Service/blob/master/lib/templates/emails/VerifyEmail.ejs). You can create another, just gives the pass to the [EJS](https://ejs.co/) file you wish to send. Here are the locals you can use inside the template:
* `user` - The current user: `<p>Hi <%= user.username %></p>`
* `link` - The verification link: `Click here: <a href="<%= link %>"><%= link %>`

## Error handling

GraphQL Auth Service provides an `eventBus` to notify eventual errors. The `email-error` event is related to unsent emails. The `error` event is related to any other kind of errors.

```js
import { GraphQLAuthService } from 'graphql-auth-service';
import { EventEmitter } from 'events';
import express from 'express';

const app = express();
const eventEmitter = new EventEmitter();
eventEmitter.on('email-error', (email) => {
    console.log("Email not sent: "+email)
});

eventEmitter.on('error', (err) => {
    console.log("An error occured: "+err)
});
app.use('/auth', GraphQLAuthService({ eventEmitter }));
```

## In production

In production you should provide certain properties:

* [`graphiql`](#graphiql): desactivate the development IDE by setting this property to `false`.
* [`mailTransporter`](#mailtransporter): provide an email configuration to send real emails to your users.
* [`mailFrom`](#mailfrom): Define the sender address displayed in emails sent to users.
* [`host`](#host): Public URL of the service. It will be used in emails sent to users to define for instance valid confirmation link.
* [`dbConfig`](#dbconfig): Define the connection to a MongoDB database.
* [`privateKeyFilePath`](#privatekeyfilepath): Provide the file path to the Private Key that will be used.
* [`publicKeyFilePath`](#publickeyfilepath): Provide the file path to the Public Key that will be used.

*You can use a pair of Private and Public keys previously generated by GraphQL Auth Service. If you are running multiple instances behind a load balancer be sure to provide the same pair of keyrs to each instance.*


Find below an example:

```javascript
import express from 'express';
import nodemailer from 'nodemailer';
import { GraphQLAuthService, Config } from 'graphql-auth-service';
import { EventEmitter } from 'events';

const app = express();
const eventEmitter = new EventEmitter();
eventEmitter.on('email-error', (email) => {
    //Log email to be able to resend it again.
});
eventEmitter.on('error', (err) => {
    //Log error
});

const options = {
    graphiql: false,
    host: "https://my-service-public-adress.com",
    mailFrom: '"Foo Bar" <foo@bar.com>',
    mailTransporter: nodemailer.createTransport({
        host: "smtp.example.email",
        port: 465,
        secure: true,
        auth: {
        user: "FooBar",
        pass: "F@@8aR"
        }
    }),
    dbConfig: {
        address: 'login:password@something.mlab.com',
        port: '19150',
        agendaDB: 'emails',
        userDB: 'users'
    },
    eventEmitter,
    privateKeyFilePath: './private-key.txt',
    publicKeyFilePath: './public-key.txt'
};

app.use('/auth', GraphQLAuthService(options));
app.listen(process.env.PORT || 80);
```

## Decode auth tokens in other web servers

To decode authentication tokens in other servers or apps, simply use a library implementing the JSON Web Tokens specification. Then, just call its `verify` or `decode` method passing as parameters the authentication token, the Public Key and the encoding algorithm (by default `RS256` unless you specify a different encoding in the [`algorithm`](https://github.com/JohannC/GraphQL-Auth-Service#algorithm) option). 

If the operation succeeds, it means that only the Private Key could encode the token and that the user is correctly authenticated. It returns the user data.

### In JavaScript

Install the npm package [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken):

```bash
npm install jsonwebtoken
```
Excute the following code:

```js
const jwt = require('jsonwebtoken');
let token  = "ey...."; 
let publicKey =  "-----BEGIN PUBLIC KEY-----\n....\n-----END PUBLIC KEY-----\n"
jwt.verify(token, publicKey, { algorithm: 'RS256' }, (err, user) => {
    if (err) throw err;
    console.log(user)
});
```

### In Python

Install the pip package [pyjwt](https://pyjwt.readthedocs.io/en/latest/) with the crypto:
```bash
pip install pyjwt
pip install pyjwt[crypto]
```
Excute the following code:

```python
token = "ey...."; 
public_key = b'-----BEGIN PUBLIC KEY-----\n....\n-----END PUBLIC KEY-----\n'
user = jwt.decode(token, public_key, algorithms=['RS256'])
print(user)
```

**!! Note !!** You can easily fetch the Public Key by invoking [this query](https://github.com/JohannC/GraphQL-Auth-Service#get-the-public-key).
