import "reflect-metadata";
import path from "path";
import { MikroORM } from "@mikro-orm/core";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import cors from "cors";
import OrmConfig from "./mikro-orm.config";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/uers";
// import redis from "redis";
import Redis from "ioredis";
import { createConnection } from "typeorm";
import session from "express-session";
import connectRedis from "connect-redis";
import { __prod__, COOKIE_NAME } from "./constants";
import sendEmail from "./utils/sendEmail";
import { User } from "./entites/User";
import { Post } from "./entites/Post";
import { Updoot } from "./entites/Updoot";
const PORT = 8888;

// res.header("Access-Control-Allow-Origin", "YOUR-DOMAIN.TLD"); // update to match the domain you will make the request from
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

const main = async () => {
  const conn = await createConnection({
    type: "mysql",
    database: "lireddit2",
    username: "root",
    password: "794838927",
    logging: true,
    synchronize: false,
    // migrations: [ path.join(__dirname, './migrations/1627815485205-FakePosts.ts')],
    entities: [Updoot, Post, User],
  });

  // await conn.runMigrations();

  // await Post.delete({});
  // const orm = await MikroORM.init(OrmConfig);
  //   await orm.em.nativeDelete(User, {});
  //   await orm.getMigrator().up();
  const app = express();
  const RedisStore = connectRedis(session);
  // const redisClient = redis.createClient();
  const redis = new Redis({});
  //   sendEmail("794838927@qq.com", "What are you dong?");

  app.use(
    cors({
      origin: ["http://localhost:3000", "https://studio.apollographql.com"],
      credentials: true,
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
        maxAge: 1000 * 60 * 60 * 24 * 365 * 1,
        httpOnly: true,
        sameSite: "lax", // csrf
        secure: __prod__,
      },
      saveUninitialized: true,
      secret: "794838927",
      resave: true,
    })
  );
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({
      // em: orm.em,
      req,
      res,
      redis,
    }),
  });
  apolloServer.applyMiddleware({
    app,
    cors: false /* { origin: 'http://localhost:3000' } */,
  });
  //app.get('/', (_req, res) => { res.send('hello express') });
  app.listen(PORT, () => console.log(`localhost listen on port ${PORT}`));
  /*  await orm.getMigrator().up();
    const post = orm.em.create(Post, { title: "My Post", created_at: new Date(), updated_at: new Date });
    await orm.em.persistAndFlush(post);
    await orm.em.nativeInsert(Post, { title: "my first post2"}); */
  // const posts = await orm.em.find(Post, {});
  // console.log(posts);
};

main().catch((err) => {
  console.error(err);
});

console.log("Hello graphql");
