import {
  Resolver,
  Query,
  Mutation,
  Ctx,
  Arg,
  Int,
  InputType,
  Field,
  UseMiddleware,
} from "type-graphql";
import { Post } from "../entites/Post";

import { MyContext } from "../types";
import { sleep } from "../utils/sleep";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  async posts(
    @Arg("limit", () => Int!) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): // @Ctx() { em }: MyContext
  Promise<Post[]> {
    // await sleep(1000);
    // return Post.find();
    // return em.find(Post, {});
    const realLimit = Math.min(50, limit);
    const qb = getConnection().getRepository(Post).createQueryBuilder("p");
    if (cursor) {
      qb.where('"createdAt" > :cursor', { cursor: new Date(parseInt(cursor)) });
    }
    return qb.orderBy('"createdAt"', "DESC").take(realLimit).getMany();
  }

  @Query(() => Post, { nullable: true })
  post(
    @Arg("id", () => Int) id: number
    // @Ctx() { em }: MyContext
  ): Promise<Post | undefined> {
    // return em.findOne(Post, { id });
    return Post.findOne(id);
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): // @Arg('title', () => String) title: string,
  // @Ctx() { em }: MyContext
  Promise<Post | null> {
    console.log(req.session, "req");

    // const post = em.create(Post, { title });
    // await em.persistAndFlush(post);
    // return post;
    /*    if (!req.session.userId) {
      throw new Error("not authenticated");
    } */

    return Post.create({ ...input, creatorId: req.session.userId }).save();
  }

  @Mutation(() => Post)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String, { nullable: true }) title: string
    // @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    // const post = await em.findOne(Post, { id });
    const post = await Post.findOne({ where: { id } });
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      // post.title = title;
      // await em.persistAndFlush(post);
      await Post.update({ id }, { title });
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(
    @Arg("id", () => Int) id: number
    // @Ctx() { em }: MyContext
  ): Promise<Boolean> {
    await Post.delete(id);
    // await em.nativeDelete(Post, { id });
    return true;
  }
}
