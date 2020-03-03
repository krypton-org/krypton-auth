Security
========

GraphQL Auth Service follows the security guidelines of this article: `The Ultimate Guide to handling JWTs on frontend clients <https://blog.hasura.io/best-practices-of-using-jwt-with-graphql/>`_.

By logging-in a user will receive a short-lived authentication token and a long-lived refresh token. The authentication token should not be saved in the localstorage (prone to `XSS <https://www.owasp.org/index.php/Cross-site_Scripting_(XSS)>`_), but in a variable. The refresh token is set automatically as an HttpOnly cookie (safe from `XSS <https://www.owasp.org/index.php/Cross-site_Scripting_(XSS)>`_).

By default, the authentication token is valid for 15 minutes. Afterwards you will have to make a call to the :ref:`refreshToken <refresh-authentication-tokens>` mutation to have a new one. This mutation will use the refresh token set in the HttpOnly cookie to authenticate the user and give back his new authentication token. This refresh token is by default valid for 7 days and allows you to have a persistent session. Note that the refresh token is also refreshed on every call to the :ref:`refreshToken <refresh-authentication-tokens>` mutation so that an active user never gets disconnected.

.. image:: _images/sequence_diagram-security.svg
   :align: center
   :alt: GraphQL Auth Service - System Design diagram

This process is safe from `CSRF <https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF)>`_ attacks, because even though a form submit attack can make a call to the :ref:`refreshToken <refresh-authentication-tokens>` mutation, the attacker cannot get the new JWT token value that is returned.

The only risk left is that by an XSS attack an authentication token gets stolen. The attacker could then make requests with the identity of the hacked user during a period of time up to 15 minutes. That is why to change any user information like the password, email or username with the :ref:`updateMe <update-user>` mutation, the system will check the authentication token and the refresh token. It prevents the attacker from taking over the targeted user account by modifying those fields.

Anyway, you should learn on how to protect your application from XSS attacks to ensure maximum security to your users. Here is a `cheat sheet <https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html>`_ made by `OWASP <http://owasp.org>`_. Note that GrahQL-Auth-Service is escaping any HTML special character like ``<`` ``>`` in the data provided by users (except for passwords which are hashed and never returned to the client).

