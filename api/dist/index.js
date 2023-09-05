"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const pg_promise_1 = __importDefault(require("pg-promise"));
const DB_URL = "postgres://postgres:@localhost:5432/taskr";
const pgp = (0, pg_promise_1.default)({});
const db_conn = pgp(DB_URL);
const API_PORT = 4000;
// SCHEMA DEFINITION
const typeDefs = (0, apollo_server_express_1.gql) `
    type Todo {
        id: ID!
        text: String!
        completed: Boolean!
    }

    type Query {
        todos: [Todo]
    }

    type Mutation {
        addTodo(text: String!): Todo,
        editTodo(id: ID!, text: String!): Todo,
        deleteTodo(id: ID!): Boolean,
    }
`;
// RESOLVERS AND THEIR ARGUMENTS' INTERFACES
const queryResolvers = {
    todos: async () => {
        return await db_conn.any('SELECT * FROM todos');
    }
};
const addTodo = async (_, { text }) => {
    const todo = await db_conn.one('INSERT INTO todos(text, completed) VALUES($1, false) RETURNING *', [text]);
    return todo;
};
const editTodo = async (_, { id, text }) => {
    const todo = await db_conn.one('UPDATE todos SET text = $1 WHERE id = $2', [text, id]);
    return todo;
};
const deleteTodo = async (_, { id }) => {
    await db_conn.result('DELETE FROM todos WHERE id = $1', [id]);
    return true;
};
const mutationResolvers = {
    addTodo: addTodo,
    editTodo: editTodo,
    deleteTodo: deleteTodo
};
const resolvers = {
    Query: queryResolvers,
    Mutation: mutationResolvers
};
// APOLLO/EXPRESS SERVER
const startServer = async () => {
    const apollo_server = new apollo_server_express_1.ApolloServer({ typeDefs, resolvers });
    await apollo_server.start();
    const app = (0, express_1.default)();
    apollo_server.applyMiddleware({ app });
    app.listen({ port: API_PORT }, () => {
        console.log(`🚀 Server ready at http://localhost:4000${apollo_server.graphqlPath}`);
    });
};
/// SEND IT
startServer();
