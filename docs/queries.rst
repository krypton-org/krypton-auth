Queries
=======

Register
^^^^^^^^

To register simply use the ``register`` mutation. You will have to provide the different ``fields`` of your user model. Please refer to the :ref:`extended-schema` section to learn how to customize your user model.

.. graphiql::
   :query:
    mutation {
      register(fields: {
        email: "yourname@mail.com", 
        password: "yourpassword"
      })
    }

**Errors:**
:any:`EmailAlreadyExistsError`,
:any:`UserValidationError`,
:any:`EncryptionFailedError`.

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

To log-in simply use the ``login`` mutation. You will have to your ``email`` and ``password``. It will return your authentication token with its expiry date and set an HttpOnly cookie with a refresh token. Save the authentication token and its expiry date in a variable of your app and not in the localstorage (prone to `XSS <https://www.owasp.org/index.php/Cross-site_Scripting_(XSS)>`_).
You will be able to access private mutations/queries by including it in the ``Authorization`` header of the request as a ``Bearer token``. This token will be usable until its expiry date (by default 15 minutes). When outdated refresh it by calling the :ref:`refreshToken <refresh-authentication-tokens>` mutation.

.. graphiql::
   :query:
    mutation {
      login(email: "yourname@mail.com", password: "yourpassword") {
        token
        expiryDate
        user {
          _id
          email_verified
        }
      }
    }

**Errors:**
:any:`UserNotFoundError`,
:any:`TokenEncryptionError`.

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
        email_verified
        email
      }
    }

**Errors:**
:any:`UnauthorizedError`.

.. _update-user:

Update user information
^^^^^^^^^^^^^^^^^^^^^^^

To change any of your user fields, use the ``updateMe`` mutation. You have to be logged in to perform this request. Simply include your authentication token as ``Bearer token`` in the ``Authorization`` header of your request (see :ref:`graphql-queries`). If you update your ``email``, you will receive a verification email like for registration. To change your password, please see in the next section. 

.. graphiql::
   :withtoken:
   :query:
    mutation {
      updateMe(fields: {email: "yourname2@mail.com"}) {
        token
        expiryDate
        user {
          _id
          email_verified
        }
      }
    }

**Errors:**
:any:`UnauthorizedError`,
:any:`EmailAlreadyExistsError`,
:any:`UsernameAlreadyExistsError`,
:any:`UserValidationError`.

.. note:: By updating your user data, remember to refresh your auth token by calling the :ref:`refreshToken <refresh-authentication-tokens>` mutation. If you don't, other services decrypting the token with the Public Key would have an outdated version of your data.

Change password
^^^^^^^^^^^^^^^

To change your password, use the ``updateMe`` mutation passing your ``previousPassword`` and your new desired ``password``. You have to be logged in to perform this request. Simply include your authentication token as ``Bearer token`` in the ``Authorization`` header of your request (see :ref:`graphql-queries`). 

.. graphiql::
   :withtoken:
   :query:
    mutation {
      updateMe(fields: {previousPassword: "yourpassword", password: "newpassword"}) {
        token
        expiryDate
        user {
          _id
          email_verified
        }
      }
    }

**Errors:**
:any:`UnauthorizedError`,
:any:`WrongPasswordError`,
:any:`EncryptionFailedError`.

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
        sendPasswordRecoveryEmail(email: "yourname@mail.com")
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
      deleteMe(password: "yourpassword") 
    }

**Errors:**
:any:`WrongPasswordError`,
:any:`UnauthorizedError`.

.. _check-available-credentials:

Check for available credentials
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

To know if an email is available use the ``emailAvailable`` query.

.. graphiql::
    :query:
     query {
       emailAvailable(email: "yourname@mail.com")
     }

.. _fetch-public-user-data:

Get public user data
^^^^^^^^^^^^^^^^^^^^

There are many query types to fetch public user data. You don't need to be authenticated to perform those queries. It will retrieve only the user data declared as public in your user model. See :ref:`extended-schema` to learn how to customize your user model.

To fetch one public user information from any of its public fields use the ``userOne`` query.

.. graphiql::
    :query:
     query {
       userOne(filter: {email: "yourname@mail.com"}) {
         _id
       }
     }

To fetch public user information from its ``id`` use use the ``userById`` query.

.. graphiql::
   :query:
    query {
      userById(_id:"5dexacb7e951cd02cb8d889") {
        email
      }
    }

To fetch multiple users from any of its public fields use the ``userMany`` query.

.. graphiql::
    :query:
     query {
       userMany(filter: {gender: Male}) {
         email
       }
     }

To count users, with filters on one some of the public fields, use the ``userCount`` query.

.. graphiql::
    :query:
     query {
       userCount(filter: {gender: Male})
     }

To fetch public user information from a list of ``ids`` use the ``userByIds`` query.

.. graphiql::
   :query:
    query {
      userByIds(_ids:["5deeacb7e9acd02cb8efd889", "5deee11b8938bc27989d63fb"]) {
        email
      }
    } 

To get a paginated list of users, with filters on one some of the public fields, use the ``userPagination`` query.

.. graphiql::
    :query:
     query {
       userPagination(filter: {gender: Male}, page:1, perPage:5){
         items{
           email
         }
       }
     }

Errors
^^^^^^

.. Unfortunately, we have to list errors by hand since
   `.. autoclass:: ErrorTypes` produces dotted names.

.. autoattribute:: EmailAlreadyExistsError
.. autoattribute:: WrongPasswordError
.. autoattribute:: UpdatePasswordTooLateError
.. autoattribute:: EmailNotSentError
.. autoattribute:: UserNotFoundError
.. autoattribute:: UnauthorizedError
.. autoattribute:: TokenEncryptionError
.. autoattribute:: EmailAlreadyConfirmedError
.. autoattribute:: UserValidationError
.. autoattribute:: AlreadyLoggedInError
.. autoattribute:: EncryptionFailedError

