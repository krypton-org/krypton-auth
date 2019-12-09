const fs = require('fs');
const { generateKeys } = require('./service/crypto/RSAKeysGeneration');
const path = require('path');
const graphqlHTTP = require('express-graphql');
const DEFAULT_PUBLIC_KEY_FILE = path.resolve(__dirname, './public-key.txt');
const DEFAULT_PRIVATE_KEY_FILE = path.resolve(__dirname, './private-key.txt');
const renderGraphiQL = require('./graphiql/renderGraphiQL');
const accepts = require('accepts');

/**
 * Mount the GraphQL Auth Service on the Express app passed in argument.
 * @param {Express app} app Express app instance
 * @param {Object} options GraphQL Auth Service config
 * @api public
 */
function mount(app, options) {
    if (!options) options = {};

    if (options.publicKey === undefined || options.privateKey === undefined) {
        if (options.publicKeyFilePath !== undefined || options.privateKeyFilePath !== undefined) {
            options.publicKey = fs.readFileSync(options.publicKeyFilePath).toString();
            options.privateKey = fs.readFileSync(options.privateKeyFilePath).toString();
        } else if (fs.existsSync(DEFAULT_PUBLIC_KEY_FILE) && fs.existsSync(DEFAULT_PRIVATE_KEY_FILE)) {
            options.publicKey = fs.readFileSync(DEFAULT_PUBLIC_KEY_FILE).toString();
            options.privateKey = fs.readFileSync(DEFAULT_PRIVATE_KEY_FILE).toString();
        } else {
            const { publicKey, privateKey } = generateKeys();
            fs.writeFileSync(DEFAULT_PRIVATE_KEY_FILE, privateKey, (err) => console.log(err));
            fs.writeFileSync(DEFAULT_PUBLIC_KEY_FILE, publicKey, (err) => console.log(err));
            options.publicKey = publicKey;
            options.privateKey = privateKey;
        }
    };

    let config = require('./config');
    Object.keys(options).map(prop => {
        if (typeof (config[prop]) === "object" && typeof (options[prop]) !== "string") {
            config[prop] = {
                ...config[prop], ...options[prop]
            }
        } else {
            config[prop] = options[prop];
        }
    });
    const db = require('./service/db/db');
    db.init()

    const bodyParser = require('body-parser');
    const helmet = require('helmet');
    const Router = require('./router/Router');
    const ErrorHandler = require('./service/error/ErrorHandler');
    const UserModel = require('./model/UserModel');
    const graphqlSchema = require('./graphql/Schema');

    app.use((req, res, next) => {
        req.options = options;
        next();
    });
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(helmet());
    app.use(async (req, res, next) => {
        const bearerHeader = req.headers['authorization'];
        if (typeof bearerHeader !== 'undefined') {
            const bearer = bearerHeader.split(' ');
            const bearerToken = bearer[1];
            try {
                const user = await UserModel.verify(bearerToken, req.options.publicKey);
                req.user = user;
                next();
            } catch (err) {
                next(err);
            }
        } else {
            next();
        }
    });
    app.use(Router);
    app.use(ErrorHandler);
    if (config.graphiql){
        app.use('/graphql',  async (req, res, next) => {
            const params = await graphqlHTTP.getGraphQLParams(req);
            if (!params.raw && accepts(req).types(['json', 'html']) === 'html'){
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.send(renderGraphiQL(params));
            }
            else next();
        });
    }

    app.use(
        '/graphql',
        graphqlHTTP(async (req, res) => {
            return {
                schema: graphqlSchema,
                graphiql: false,
                context: {
                    req: req,
                },
            };
        })
    );

    app.use(function (err, req, res, next) {
        if (options.errorlogFile) fs.appendFile(congig.errorlogFile, JSON.stringify(job.attrs.data) + '\n');
        const notifications = [];
        notifications.push({ type: 'error', message: 'A mistake has happened. Sorry for the inconvenience, we are going to investigate it.' })
        res.json({ notifications: notifications });
    });
    return app;
}

exports = module.exports = mount;
