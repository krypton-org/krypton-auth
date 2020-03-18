Queries
=======

Register
^^^^^^^^

To register simply use the ``register`` mutation. You will have to provide the different ``fields`` of your user model. Please refer to the :ref:`extended-schema` section to learn how to customize your user model.

.. graphiql::
   :query:
    mutation {
      register(fields: {username: "yourname", email: "yourname@mail.com", password: "yourpassword"}) {
        notifications {
          type
          message
        }
      }
    }

**Errors:**
:any:`ErrorTypes.EmailAlreadyExistsError`,
:any:`ErrorTypes.UsernameAlreadyExistsError`,
:any:`ErrorTypes.UserValidationError`,
:any:`ErrorTypes.EncryptionFailedError`,

Once registered you will receive an email to verify your account. This email is customizable, see :any:`Config.verifyEmailTemplate`.

.. image:: _images/graphql_auth_service-verification-email.png
   :align: center
   :alt: GraphiQL Auth Token - User verification email

Clicking on the link will lead you to a notification page. This page is customizable, see :any:`Config.notificationPageTemplate`.

.. image:: _images/graphql_auth_service-verification-page.png
   :align: center
   :alt: GraphiQL Auth Token - User verification page

Login
^^^^^

To log-in simply use the ``login`` mutation. You will have to provide a ``login`` which can be the email or username of your account and your ``password``. It will return your authentication token with its expiry date and set an HttpOnly cookie with a refresh token. Save the authentication token and its expiry date in a variable of your app and not in the localstorage (prone to `XSS <https://www.owasp.org/index.php/Cross-site_Scripting_(XSS)>`_).
You will be able to access private mutations/queries by including it in the ``Authorization`` header of the request as a ``Bearer token``. This token will be usable until its expiry date (by default 15 minutes). When outdated refresh it by calling the :ref:`refreshToken <refresh-authentication-tokens>` mutation.

.. graphiql::
   :query:
    mutation {
      login(login: "yourname@mail.com", password: "yourpassword") {
        token
        expiryDate
        user {
          _id
          verified
        }
      }
    }

**Errors:**
:any:`ErrorTypes.UserNotFound`,

.. _access-user-private-data:

Access user private data
^^^^^^^^^^^^^^^^^^^^^^^^

To access your own private data use the ``me`` query.  You have to be logged in to perform this request. Simply include your authentication token as ``Bearer token`` in the ``Authorization`` header of your request (see :ref:`graphql-queries`).

**Errors:** 

.. graphiql::
   :withtoken:
   :query:
    query {
      me {
        _id
        verified
        email
        username
      }
    }

**Errors:**
:any:`ErrorTypes.UserNotFound`.

.. _update-user:

Update user information
^^^^^^^^^^^^^^^^^^^^^^^

To change any of your user fields, use the ``updateMe`` mutation. You have to be logged in to perform this request. Simply include your authentication token as ``Bearer token`` in the ``Authorization`` header of your request (see :ref:`graphql-queries`). If you update your ``email``, you will receive a verification email like for registration. To change your password, please see in the next section. 

.. graphiql::
   :withtoken:
   :query:
    mutation {
      updateMe(fields: {username: "yourname2"}) {
        notifications {
          message
        }
      }
    }

**Errors:**
:any:`ErrorTypes.UserNotFound`,
:any:`EmailAlreadyExistsError,
:any:`UsernameAlreadyExistsError,
:any:`ErrorType.UserValidationError.

.. note:: By updating your user data, remember to refresh your auth token by calling the :ref:`refreshToken <refresh-authentication-tokens>` mutation. If you don't, other services decrypting the token with the Public Key would have an outdated version of your data.

Change password
^^^^^^^^^^^^^^^

To change your password, use the ``updateMe`` mutation passing your ``previousPassword`` and your new desired ``password``. You have to be logged in to perform this request. Simply include your authentication token as ``Bearer token`` in the ``Authorization`` header of your request (see :ref:`graphql-queries`). 

.. graphiql::
   :withtoken:
   :query:
    mutation {
      updateMe(fields: {previousPassword: "yourpassword", password: "newpassword"}) {
        notifications {
          message
        }
      }
    }

**Errors:**
:any:`ErrorTypes.UserNotFound`,
:any:`ErrorTypes.WrongPasswordError`,
:any:`ErrorTypes.EncryptionFailedError`.

.. _refresh-authentication-tokens:

Refresh token
^^^^^^^^^^^^^

By default your authentication token is valid for 15 minutes. To refresh it, use the ``refreshToken`` mutation. It will send you back a new authentication token and expiry date. You don't need to pass your actual authentication token in the ``Authorization`` header, it only needs the cookie containing your refresh token **transmitted by default** by your browser. This refresh token will also be refreshed. Thus, unless you stay inactive during a long period of time (by default 7 days), you will never have to log-in again. 

.. graphiql::
   :query:
    mutation {
      refreshToken {
        expiryDate
        token
      }
    }

.. _get-public-key:

Get public key
^^^^^^^^^^^^^^

Easily fetch the public key of the service with this query in order to decode the authentication token on your other web servers/apps, see :ref:`decode-tokens`.

.. graphiql::
   :query:
    query {
      publicKey
    }

.. _reset-password:

Reset password
^^^^^^^^^^^^^^

To reset your forgotten password, use the ``sendPasswordRecoveryEmail`` query passing the ``email`` address of your account.

.. graphiql::
   :query:
    query {
      sendPasswordRecoveryEmail(email: "yourname@mail.com") {
        notifications {
          message
        }
      }
    }

If your email is present in the user database you will receive an email to reset your password. This email is customizable, see :any:`Config.resetPasswordEmailTemplate`.

.. image:: _images/graphql_auth_service-reset-password-email.png
   :align: center
   :alt: GraphiQL Auth Token - Reset password email

Clicking on the link will lead you to a notification page. This page is customizable, see :any:`Config.resetPasswordFormTemplate`.

.. image:: _images/graphql_auth_service-reset-password-page.png
   :align: center
   :alt: GraphiQL Auth Token - Reset password page


Delete account
^^^^^^^^^^^^^^

To delete your account, use the ``deleteMe`` mutation. You have to be logged in to perform this request. Simply include your authentication token as ``Bearer token`` in the ``Authorization`` header of your request (see :ref:`graphql-queries`). 

.. graphiql::
   :withtoken:
   :query:
    mutation {
      deleteMe(password: "yourpassword") {
        notifications {
          message
        }
      }
    }

**Errors:**
:any:`WrongPasswordError`,
:any:`ErrorTypes.UserNotFound`.

.. _fetch-public-user-data:

Get public user data
^^^^^^^^^^^^^^^^^^^^

There are many query types to fetch public user data. You don't need to be authenticated to perform those queries. It will retrieve only the user data declared as public in your user model. See :ref:`extended-schema` to learn how to customize your user model.

To fetch one public user information from any of its public fields use the ``userOne`` query.

.. graphiql::
    :query:
     query {
       userOne(filter: {username: "yourname"}) {
         _id
       }
     }

To fetch public user information from its ``id`` use use the ``userById`` query.

.. graphiql::
   :query:
    query {
      userById(_id:"5dexacb7e951cd02cb8d889") {
        username
      }
    }

To fetch public user information from a list of ``ids`` use use the ``userByIds`` query.

.. graphiql::
   :query:
    query {
      userByIds(_ids:["5deeacb7e9acd02cb8efd889", "5deee11b8938bc27989d63fb"]) {
        username
      }
    } 

* ``userMany``: to fetch one or many user public information from any of its public fields.
* ``userCount``: to count users according to criteria based on any user public fields.
* ``userPagination``: to list users with pagination configuration.

Errors
^^^^^^

.. js:autoclass:: ErrorTypes
   :members:
