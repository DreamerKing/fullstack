import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../types";

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
  console.log(context.req, "ctx");
  console.log(context.req.session.id, "session.id");

  if (!context.req.session.userId) {
    throw new Error("not authenticated");
  }
  return next();
};
