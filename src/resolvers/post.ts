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
import { User } from "../entites/User";

import { MyContext } from "../types";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { Updoot } from "../entites/Updoot";

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

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("userId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;
    const { userId } = req.session;
    await Updoot.insert({
      userId,
      postId,
      value: realValue,
    });
    // await Post.update({
    //   id: postId,
    // });
    await getConnection().query(
      `
      start transaction;

      insert into updoot ("userId","postId", value) values (${userId}, ${postId}, ${realValue});

      update post p
      set p.points = p.points + ${realValue}
      where p.id = ${postId};

      commit;
    `,
      [realValue, postId]
    );
    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int!) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
    // @Arg("info") info: any
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;
    const replacements: any[] = [realLimitPlusOne];
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }
    console.log(replacements);
    let qb = getConnection()
      .getRepository(Post)
      .createQueryBuilder("p")
      .innerJoinAndSelect("p.creator", "u", "u.id = p.creatorId")
      .take(realLimitPlusOne);
    if (cursor) {
      qb.where("p.createdAt < :cursor", { cursor: new Date(parseInt(cursor)) });
    }
    qb.orderBy("p.createdAt", "DESC");
    if (realLimitPlusOne) {
      qb.limit(realLimitPlusOne);
    }
    let posts = await qb.getMany();

    /* const posts = await getConnection().query(
      `select p.*,
      json_build_object(
        'id', u.id, 
        'username', u.username,
        'email', u.email
        ) creator
      from post p
      inner join public.user u on u.id = p.creatorId 
      ${cursor ? ` where p."createdAt" < $2` : ""}
      order by p.createdAt DESC
      limit $1
    `,
      replacements
    ); */

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    console.log(req.session, "req");
    return Post.create({ ...input, creatorId: req.session.userId }).save();
  }

  @Mutation(() => Post)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne({ where: { id } });
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      await Post.update({ id }, { title });
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("id", () => Int) id: number): Promise<Boolean> {
    await Post.delete(id);
    return true;
  }
}
