import {
  Resolver,
  Query,
  Mutation,
  Ctx,
  Arg,
  Int,
  InputType,
  ObjectType,
  Field,
  UseMiddleware,
  FieldResolver,
  Root,
} from "type-graphql";
import { Post } from "../entites/Post";

import { MyContext } from "../types";
import { sleep } from "../utils/sleep";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
// import { PostgreSqlConnection } from "@mikro-orm/postgresql";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int!) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): // @Ctx() { em }: MyContext
  Promise<PaginatedPosts> {
    // await sleep(1000);
    // return Post.find();
    // return em.find(Post, {});
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;
    const replacements: any[] = [realLimit, realLimitPlusOne];
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }
    let r = await getConnection().query(
      `select p.*,
      json_build_object(
        'id', u.id,
        'username', u.username,
        'email', u.email
        ) creator
      from post p
      inner join public.user u on u.id = p."creatorId" 
      ${cursor ? ` where p."createdAt" < $2` : ""}
      'order by p."createdAt" DESC
      limit $1`,
      replacements
    );
    console.log(r, "r");

    // const qb = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder("p")
    //   .innerJoinAndSelect("p.creator", "u", 'u.id = p."creatorId"')
    //   .orderBy('p."createdAt"', "DESC")
    //   .take(realLimitPlusOne);
    // if (cursor) {
    //   qb.where('p."createdAt" > :cursor', {
    //     cursor: new Date(parseInt(cursor)),
    //   });
    // }
    // const posts = await qb.getMany();
    return {
      posts: [], //posts.slice(0, realLimit),
      hasMore: false, //posts.length === realLimitPlusOne,
    };
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
