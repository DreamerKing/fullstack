import { MyContext } from "../types";
import {
  Resolver,
  Ctx,
  Mutation,
  Arg,
  Query,
  Field,
  ObjectType,
} from "type-graphql";
import argon2 from "argon2";
import { v4 } from "uuid";
import { User } from "../entites/User";
import { COOKIE_NAME } from "../constants";
import { EntityManager } from "@mikro-orm/mysql";
import {
  UsernamePasswordInput,
  UsernameOrEmailPasswordInput,
} from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { FORGOT_PASSWORD_PREFIX } from "../constants";
import sendEmail from "../utils/sendEmail";
import { getConnection } from "typeorm";

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext) {
    console.dir(req.session, { depth: Infinity });

    if (!req.session.userId) {
      return null;
    }
    // const user = await em.findOne(User, { id: req.session.userId });
    const user = await User.findOne(parseInt(req.session.userId));
    return user;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req, res }: MyContext
  ) {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "length must be greater than 2",
          },
        ],
      };
    }
    const key = FORGOT_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired",
          },
        ],
      };
    }
    // const user = await em.findOne(User, { id: parseInt(userId) });
    const idNum = parseInt(userId);
    const user = await User.findOne(idNum);
    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exist",
          },
        ],
      };
    }
    // user.password = await argon2.hash(newPassword);
    // await em.persistAndFlush(user);
    await User.update(
      {
        id: idNum,
      },
      {
        password: await argon2.hash(newPassword),
      }
    );
    await redis.del(key);
    req.session.userId = user.id;
    return { user };
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput
    // @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    // if (options.username.length <= 2) {
    //   return {
    //     errors: [
    //       {
    //         field: "username",
    //         message: "length must be greater than 2",
    //       },
    //     ],
    //   };
    // }
    // if (options.email.includes("@")) {
    //   return {
    //     errors: [
    //       {
    //         field: "email",
    //         message: "invalid email",
    //       },
    //     ],
    //   };
    // }
    // if (options.password.length <= 2) {
    //   return {
    //     errors: [
    //       {
    //         field: "password",
    //         message: "length must be greater than 3",
    //       },
    //     ],
    //   };
    // }
    console.log(options, "options");

    const errors = validateRegister(options);
    console.log(errors, "errors");

    if (errors) {
      return { errors };
    }
    const hashpassword = await argon2.hash(options.password);

    /*   const user = em.create(User, {
      username: options.username,
      email: options.email,
      password: hashpassword,
    }); */
    let user;

    try {
      //await em.persistAndFlush(user);
      //   const result = await (em as EntityManager)
      //     .createQueryBuilder(User)
      //     .getKnexQuery()
      //     .insert({
      //       username: options.username,
      //       password: hashpassword,
      //       email: options.email,
      //       created_at: new Date(),
      //       updated_at: new Date(),
      //     });
      //   console.log(result, "result");

      //   user = result[0];
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username: options.username,
          email: options.email,
          password: hashpassword,
        })
        .execute();
      user = result.raw[0];
      console.log(result);
    } catch (error) {
      console.log(error, ">>>>>");

      if (error.errno === 1062) {
        return {
          errors: [
            {
              field: "username",
              message: "username already taken",
            },
          ],
        };
      }
    }
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernameOrEmailPasswordInput,
    @Ctx() { req }: MyContext
  ) {
    /* const user = await em.findOne(
      User,
      options.usernameOrEmail.includes("@")
        ? { email: options.usernameOrEmail }
        : { username: options.usernameOrEmail.toLowerCase() }
    ); */
    const user = await User.findOne({
      where: options.usernameOrEmail.includes("@")
        ? { email: options.usernameOrEmail }
        : { username: options.usernameOrEmail.toLowerCase() },
    });
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "this username doesn't exist",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ],
      };
    }
    console.log(user, "user", req.session);

    req.session.userId = user.id;
    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext): Promise<Boolean> {
    return new Promise((resolve) => {
      req.session.destroy((err: any) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.error(err);
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    // const user = await em.findOne(User, { email });
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return true;
    }
    const token = v4().toString();
    const key = FORGOT_PASSWORD_PREFIX + token;
    redis.set(key, user.id, "ex", 1000 * 60 * 60 * 24 * 3);
    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );
    return true;
  }
}
