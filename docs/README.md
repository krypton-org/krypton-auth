Online documentation is at https://jrebecchi.github.io/GraphQL-Auth-Service.

## Instructions for building the documentation

```bash
python build.py
```

- [reStructuredText basics](https://www.sphinx-doc.org/en/master/usage/restructuredtext/basics.html)
- Docstring can contain JSDoc and reStructuredText annotations, but no markdown.
  See https://github.com/mozilla/sphinx-js/issues/69

### Customization

- `_templates/about.html`: fork of alabaster about.html with links to GH Actions and Coveralls instead of Travis-CI and Codecov.
- `_templates/layout.html`: include graphiql script.

### Extensions

- [mozilla/sphinx-js](https://github.com/mozilla/sphinx-js): sphinx_js
- [maxmouchet/sphinx-plugins](https://github.com/maxmouchet/sphinx-plugins): sphinx_graphiql, sphinx_md2html

### TODO

- [ ] Document properties usage (app.config(...))
- [ ] Finish quick start
