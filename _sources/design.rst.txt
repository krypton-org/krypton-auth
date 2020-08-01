Design
======

This authentication system works with a pair of Private and Public Keys:
1. When a user logs-in, Krypton Authentication generates a token from the Private Key (with JSON Web Tokens). This token will encode the user data.
2. Then, the user is able to make authenticated requests to other servers by including the token into the request headers. Those servers can decode the token with the Public Key and access the user data. If the decoding works, it means that only the Private Key could encode the token and it guarantees the user's identity.

Below the corresponding sequence diagram:

.. image:: https://nusid.net/img/sequence_diagram-graphql_auth_service.svg
   :align: center
   :alt: Krypton Authentication - Sequence diagram

This library aims to be replicated behind a load balancer. It is completely stateless (no session stored). All your replicas would have to be sharing the same pair of Private and Public Keys.

Below a possible system design you could use:

.. image:: https://nusid.net/img/system_design_diagram-graphql_auth_service.svg
   :align: center
   :alt: Krypton Authentication - System Design diagram
