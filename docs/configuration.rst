Configuration
=============

Properties
----------

Properties are set when the service is instantiated, for example:

.. code-block:: js

    app.use(kryptonAuth({ mailFrom: '"Fred Foo 👻" <foo@example.com>' }));

.. autoclass:: Config
    :members:

Error Handling
--------------

Krypton Authentication provides an ``eventBus`` to notify eventual errors. The ``email-error`` event is related to unsent emails. The ``error`` event is related to any other kind of errors.

.. code-block:: js

    const kryptonAuth = require('krypton-auth');
    const express = require('express');
    const EventEmitter = require('events');
    
    const app = express();
    const eventEmitter = new EventEmitter();
    eventEmitter.on('email-error', (email) => {
        console.log("Email not sent: "+email)
    });
    
    eventEmitter.on('error', (err) => {
        console.log("An error occured: "+err)
    });

    app.use('/auth', kryptonAuth({ eventEmitter }));


.. _extended-schema:

Extended Schema
---------------

The true power of Krypton Authentication is the ability to customize the user model to your own needs.
   
To achieve that you simply need to pass the different `Mongoose Schema <https://mongoosejs.com/docs/guide.html>`_ fields you want to add.
Under the hood, those extra fields will be converted into GraphQL types thanks to `graphql-compose-mongoose <https://github.com/graphql-compose/graphql-compose-mongoose>`_ and added to the different queries and mutations automatically.

`Mongoose Schema <https://mongoosejs.com/docs/guide.html>`_ is very powerful, you can define the field type, default value, `custom validators <https://mongoosejs.com/docs/validation.html#custom-validators>`_ & error messages to display, if it is `required <https://mongoosejs.com/docs/validation.html#required-validators-on-nested-objects>`_, if it should be `unique <https://mongoosejs.com/docs/validation.html#the-unique-option-is-not-a-validator>`_. Please refer to its `documentation <https://mongoosejs.com/docs/guide.html>`_.

.. note:: In each schema field, you can define the ``isPrivate`` attribute. It is a ``Boolean`` attribute telling whether or not this field can be accessible by public ``queries`` like :ref:`userById <fetch-public-user-data>`, :ref:`userByOne <fetch-public-user-data>`, etc.

For example, you could pass the following ``extendedSchema``:

.. code-block:: js

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

    app.use(kryptonAuth({ extendedSchema }));

