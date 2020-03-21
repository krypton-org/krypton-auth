Quick Start
===========

Database Setup
--------------

.. code-block:: bash

    docker run -it -p 27017:27017 mongo


Service Setup
-------------

.. code-block:: bash

    npm install krypton-auth --save

.. code-block:: js

    const kryptonAuth = require('@krypton-org/krypton-auth');
    const express = require('express');
    
    const app = express();
    
    app.use('/auth', kryptonAuth());
    
    app.listen(process.env.PORT || 5000, () => {
        // The service will be accessible on http://localhost:5000/auth
        console.log(`server is listening on ${process.env.PORT || 5000}`)
    })

.. _graphql-queries:

GraphQL Queries
---------------

To use Krypton Authentication, you can use the ``fetch`` method or the ``XMLHttpRequest`` Object in JavaScript. To make an authenticated request, simply include your authentication token as ``Bearer token`` in the ``Authorization`` header of your request. Please refer to this example below:

.. code-block:: js

    let headers = {
        'Content-Type': 'application/json',
        // To make an authenticated request
        'Authorization': 'Bearer ' + yourAuthToken
    };

    let query =
        `mutation {
            updateMe(fields: {username:"newusername"}) {
                notifications {
                    message
                }
            }
        }`;

    let body = JSON.stringify({ query });

    fetch('http://localhost:5000', { method: 'post', headers, body })
        .then(res => res.json())
        .then(res => console.log(res));


You also have access to the GraphiQL IDE (if the property :any:`Config.graphiql` is set to ``false``). Just open a web browser to http://localhost:5000/graphql you will be able to type the graphql queries in the IDE.


.. _decode-tokens:

Decoding JSON Web Tokens
------------------------

To decode authentication tokens in other servers or apps, simply use a library implementing the JSON Web Tokens specification. Then, just call its ``verify`` or ``decode`` method passing as parameters the authentication token, the Public Key and the encoding algorithm (by default ``RS256`` unless you specify a different encoding in the :any:`Config.algorithm` option). 

If the operation succeeds, it means that only the Private Key could encode the token and that the user is correctly authenticated. It returns the user data.

.. note:: You can easily fetch the public key with the :ref:`publicKey <get-public-key>` query.

In Javascript
^^^^^^^^^^^^^

.. code-block:: bash

    npm install jsonwebtoken

.. code-block:: js

    const jwt = require('jsonwebtoken');
    let token  = "ey...."; 
    let publicKey =  "-----BEGIN PUBLIC KEY-----\n....\n-----END PUBLIC KEY-----\n"
    jwt.verify(token, publicKey, { algorithm: 'RS256' }, (err, user) => {
        if (err) throw err;
        console.log(user)
    });


In Python
^^^^^^^^^

.. code-block:: bash

    pip install pyjwt[crypto]

.. code-block:: python

    token = "ey...."; 
    public_key = b'-----BEGIN PUBLIC KEY-----\n....\n-----END PUBLIC KEY-----\n'
    user = jwt.decode(token, public_key, algorithms=['RS256'])
    print(user)
