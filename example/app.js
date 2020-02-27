/**
 * NOTE: You need to run a local instance of MongoDB for this to work!
 */
const { GraphQLAuthService } = require('graphql-auth-service');
const express = require('express');
const app = express();

app.use('/auth', GraphQLAuthService()); //API entry point is localhost:5000/auth

app.listen(process.env.PORT || 5000, () => {
    console.log(`server is listening on ${process.env.PORT || 5000}`)
});