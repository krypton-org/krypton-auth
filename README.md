<p align="center">
<img src="/docs/_static/banner.svg">
<i>Express authentication middleware, using GraphQL and JSON Web Tokens.</i><br/><br/>
<a href="https://coveralls.io/github/krypton-org/krypton-auth?branch=master">
  <img src="https://coveralls.io/repos/github/krypton-org/krypton-auth/badge.svg?branch=master">
</a>
<a href="https://github.com/krypton-org/krypton-auth/actions">
  <img src="https://img.shields.io/github/workflow/status/krypton-org/krypton-auth/Node CI?label=tests">
</a>
<a href="https://heroku.com/deploy?template=https://github.com/krypton-org/krypton-heroku">
  <img src="https://img.shields.io/badge/heroku-deploy-blueviolet?logo=heroku">
</a>
</p>

GraphQL Auth Sevice is an authentication middleware for Express handling login, registration, password recovery and account management with GraphQL & JSON Web Tokens.

It is a free & open-source alternative to [Firebase Authentication](https://firebase.google.com/products/auth/).

- [**Documentation**](https://krypton-org.github.io/krypton-auth) — Consult the quick start guide and the online documentation.

## Features

- Authentication based on JSON Web Tokens
- XSS and CSRF protection
- Easy to customize the user data model
- Easy to integrate into web apps & mobile apps
- Easy to scale
- Test IDE included for development

## Installation

```bash
npm install graphql-auth-service --save
# or
yarn add graphql-auth-service
```

Assuming that you have a [MongoDB](https://www.mongodb.com/) instance running on `mongodb://localhost:27017/users`, you can run the following simple example.

```javascript
const { GraphQLAuthService } = require('graphql-auth-service');
const express = require('express');

const app = express();

// API entry point is localhost:5000/auth
app.use('/auth', GraphQLAuthService());

app.listen(process.env.PORT || 5000, () => {
    console.log(`server is listening on ${process.env.PORT || 5000}`)
})
```

See the [documentation](https://krypton-org.github.io/krypton-auth) for more details.
