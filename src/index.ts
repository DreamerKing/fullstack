import "reflect-metadata";
import express from "express";
import "dotenv-safe/config";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import cors from "cors";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/uers";
import Redis from "ioredis";
import { createConnection } from "typeorm";
import session from "express-session";
import connectRedis from "connect-redis";
import { __prod__, COOKIE_NAME } from "./constants";
import { User } from "./entites/User";
import { Post } from "./entites/Post";
import { Updoot } from "./entites/Updoot";
import { createUserLoader } from "./utils/createUserLoader";
import { createUpdootLoader } from "./utils/createUpdootLoader";

const main = async () => {
  const conn = await createConnection({
    type: "mysql",
    url: process.env.DATABAS_URL,
    logging: false,
    synchronize: true,
    entities: [Updoot, Post, User],
  });

  // await conn.runMigrations();
  console.log(process.env.CORS_ORIGIN ?? "".split(","), "origin");

  const app = express();
  // app.set("proxy", 1);
  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);

  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ["POST", "OPTIONS"],
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis, //redisClient,
        // disableTTL: true,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        sameSite: "lax", // csrf
        secure: __prod__,
        // domain: ''
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET as string,
      resave: false,
      proxy: true,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      updootLoader: createUpdootLoader(),
    }),
  });
  apolloServer.applyMiddleware({
    app,
    cors: {
      origin: true, // (process.env.CORS_ORIGIN as string).split(","),
      methods: ["GET", "POST", "OPTIONS"],
      credentials: true,
    },
  });
  app.listen(process.env.PORT, () =>
    console.log(`localhost listen on port ${process.env.PORT}`)
  );
};

main().catch((err) => {
  console.error(err);
});
