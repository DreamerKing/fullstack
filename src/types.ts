import { Connection, EntityManager, IDatabaseDriver } from "@mikro-orm/core";
import { Request, Response } from "express";
// import { RedisClient } from "ioredis";
// import { Session } from 'express-session'

export type MyContext = {
  // em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>
  req: Request & { session?: any };
  res: Response;
  redis: any;
};
