import React, { Component, CSSProperties } from 'react';
import { render } from 'react-dom';
import socketIOClient, { SocketIOClient } from "socket.io-client";
import GraphiQLAuthToken from 'graphiql-auth-token';

interface Notification {
    message: string,
    title: string,
    date: Date,
    type: undefined | "secondary" | "success" | "info" | "warning" | "danger"
}

interface GraphiQLData {
    query: string,
    variables: string,
    operationName: string,
}

class GraphiQLIDE extends Component<GraphiQLData, { notification: Notification }> {

    public token: string = null;
    public socket: SocketIOClient;
    public parameters: any;
    public fetchURL: string;

    constructor(props) {
        super(props);
        this.state = {
            notification: null
        }
        this.parameters = {};
        // Derive a fetch URL from the current URL, sans the GraphQL parameters.
        var graphqlParamNames = {
            query: true,
            variables: true,
            operationName: true
        };
        var otherParams = {};
        for (var k in this.parameters) {
            if (this.parameters.hasOwnProperty(k) && graphqlParamNames[k] !== true) {
                otherParams[k] = this.parameters[k];
            }
        }
        this.fetchURL = this.locationQuery(otherParams);
    }

    onTokenUpdate = (token) => {
        this.token = token;
    }

    componentDidMount() {
        this.socket = socketIOClient(this.fetchURL);
        this.socket.on("notification", data => {
            this.setState({ notification: data as Notification })
        });
    }

    componentWillUnmount() {
        this.socket.close();
    }

    safeSerialize(data) {
        return data != null ? JSON.stringify(data).replace(/\//g, '\\/') : 'undefined';
    }

    // Produce a Location query string from a parameter object.
    locationQuery(params) {
        return '?' + Object.keys(params).filter(function (key) {
            return Boolean(params[key]);
        }).map(function (key) {
            return encodeURIComponent(key) + '=' +
                encodeURIComponent(params[key]);
        }).join('&');
    }

    // When the query and variables string is edited, update the URL bar so
    // that it can be easily shared.
    onEditQuery(newQuery) {
        this.parameters.query = newQuery;
        this.updateURL();
    }

    onEditVariables(newVariables) {
        this.parameters.variables = newVariables;
        this.updateURL();
    }

    onEditOperationName(newOperationName) {
        this.parameters.operationName = newOperationName;
        this.updateURL();
    }

    updateURL() {
        history.replaceState(null, null, this.locationQuery(this.parameters));
    }

    render() {

        const variablesString = this.props.variables != null ? JSON.stringify(this.props.variables, null, 2) : null;

        window.location.search.substr(1).split('&').forEach(function (entry) {
            var eq = entry.indexOf('=');
            if (eq >= 0) {
                this.parameters[decodeURIComponent(entry.slice(0, eq))] =
                    decodeURIComponent(entry.slice(eq + 1));
            }
        });


        // Defines a GraphQL fetcher using the fetch API.
        function graphQLFetcher(graphQLParams) {
            var headers = { 'Content-Type': 'application/json' }
            if (this.token) {
                headers['Authorization'] = 'Bearer ' + this.token;
            }
            return fetch(this.fetchURL, {
                method: 'post',
                headers,
                body: JSON.stringify(graphQLParams),
            }).then(function (response) {
                return response.json();
            });
        }

        const style: CSSProperties = {
            position: 'fixed',
            height: '100%',
            width: '100%',
            left: '0px',
            top: '0px',
        }

        return (
            <div style={style}>
                <GraphiQLAuthToken
                    fetcher={graphQLFetcher}
                    onTokenUpdate={this.onTokenUpdate}
                    onEditQuery={this.onEditQuery}
                    onEditVariables={this.onEditVariables}
                    onEditOperationName={this.onEditOperationName}
                    query={this.safeSerialize(this.props.query)}
                    variables={this.safeSerialize(variablesString)}
                    operationName={this.safeSerialize(this.props.operationName)}
                    notification={this.state.notification} 
                />
            </div>
        )
    }
}

export default GraphiQLIDE;