import express from 'express';
import { ApolloServer, gql } from 'apollo-server-express';
import pgPromise from 'pg-promise';

const DB_URL = "postgres://postgres:@localhost:5432/taskr";

const pgp = pgPromise({});
const db_conn = pgp(DB_URL);

const API_PORT = 4000;

// SCHEMA DEFINITION
const typeDefs = gql`
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
`

// RESOLVERS AND THEIR ARGUMENTS' INTERFACES

const queryResolvers = {
    todos: async () => {
        return await db_conn.any('SELECT * FROM todos');
    }    
}

interface AddTodoArgs {
    text: string
}

const addTodo = async (_: unknown, { text }: AddTodoArgs ) => {
    const todo = await db_conn.one('INSERT INTO todos(text, completed) VALUES($1, false) RETURNING *', [text]);
    return todo;
}

interface EditTodoArgs {
    id: string
    text: string
}

const editTodo = async (_: unknown, {id, text}: EditTodoArgs) => {
    const todo = await db_conn.one('UPDATE todos SET text = $1 WHERE id = $2', [text, id]);
    return todo;
}

interface deleteTodoArgs {
    id: string
}

const deleteTodo = async (_: unknown, {id}: deleteTodoArgs) => {
    await db_conn.result('DELETE FROM todos WHERE id = $1', [id]);
    return true;
}


const mutationResolvers = {
    addTodo: addTodo,
    editTodo: editTodo,
    deleteTodo: deleteTodo
}

const resolvers = {
    Query: queryResolvers,
    Mutation: mutationResolvers
}

// APOLLO/EXPRESS SERVER

const startServer = async () => {
    const apollo_server = new ApolloServer({typeDefs, resolvers});

    await apollo_server.start();

    const app = express();

    apollo_server.applyMiddleware({ app });

    app.listen({ port: API_PORT}, () => {
        console.log(`🚀 Server ready at http://localhost:4000${apollo_server.graphqlPath}`);
    });
}

/// SEND IT

startServer();