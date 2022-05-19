import express from "express";
import "reflect-metadata";
import "dotenv-safe/config";
import { COOKIE_NAME, __prod__ } from "./constants";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import session from "express-session";
import Redis from "ioredis";
import connectRedis from "connect-redis";
import { MyContext } from "./types";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import cors from "cors";
import { DataSource } from "typeorm";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import path from "path";
import { Updoot } from "./entities/Updoot";
import { createUserLoader } from "./utils/createUserLoader";
import { createUpdootLoader } from "./utils/createUpdootLoader";
const main = async () => {
    const conn = new DataSource({
        type: "postgres",
        host: "localhost",
        port: 5432,
        username: "",
        password: "",
        database: "lireddit2",
        synchronize: true,
        logging: true,
        migrations: [path.join(__dirname, "./migration/*")],
        entities: [Post, User,Updoot],
    });
    await conn.initialize();
    await conn.runMigrations();
    // await Updoot.delete({});
    const app = express();
    const RedisStore = connectRedis(session);
    const redis = new Redis();
    app.use(
        cors({
            origin: "http://localhost:3000",
            credentials: true,
        })
    );
    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({
                client: redis as any,
                disableTouch: true,
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 25 * 365 * 10, //10 years
                httpOnly: true,
                sameSite: "lax", //csrf
                secure: __prod__, //cookie only works in https
            },
            saveUninitialized: false,
            secret: "sdgdsagjhtehetgkskfadf",
            resave: false,
        })
    );
    const apolloServer = new ApolloServer({
        plugins: [
            ApolloServerPluginLandingPageGraphQLPlayground({
                settings: {
                    "request.credentials": "include",
                },
            }),
        ],
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false,
        }),
        context: ({ req, res }): MyContext => ({ conn, req, res, redis, userLoader: createUserLoader(), updootLoader : createUpdootLoader() }),
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({ app, cors: false });

    app.listen(4000, () => {
        console.log("Server started on localhost : 4000");
    });
};

main().catch((err) => console.error(err));
