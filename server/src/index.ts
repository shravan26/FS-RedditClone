import { MikroORM } from "@mikro-orm/core";
import express from "express";
import "dotenv-safe/config";
import { __prod__ } from "./constants";
import mikroOrmConfig from "./mikro-orm.config";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
const { createClient } = require("redis");
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./types";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";

const main = async () => {
    const orm = await MikroORM.init(mikroOrmConfig);
    await orm.getMigrator().up();
    const app = express();
    const RedisStore = connectRedis(session);
    const redisClient = createClient({legacyMode : true});
    redisClient.connect();

    app.use(
        session({
            name: "qid",
            store: new RedisStore({
                client: redisClient as any,
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
        plugins: [ApolloServerPluginLandingPageGraphQLPlayground({
            settings : {
                'request.credentials' : 'include',
            }
        })],
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false,
        }),
        context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({ app });

    app.listen(4000, () => {
        console.log("Server started on localhost : 4000");
    });
};

main().catch((err) => console.error(err));
