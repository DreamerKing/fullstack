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
  textSnippet(@Root() post: Post) {
    return post.text.slice(0, 50);
  }

  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(post.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() post: Post,
    @Ctx() { req, updootLoader }: MyContext
  ) {
    if (!req.session.userId) {
      return null;
    }
    const updoot = await updootLoader.load({
      postId: post.id,
      userId: req.session.userId,
    });
    return updoot ? updoot.value : null;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;
    const { userId } = req.session;
    const updoot = await Updoot.findOne({ where: { postId, userId } });
    console.log(userId, "userId >>>");

    if (updoot && updoot.value !== realValue) {
      await getConnection().transaction(async (tm) => {
        await tm
          .createQueryBuilder()
          .update(Updoot)
          .set({ value: realValue })
          .where("postId = :postId and userId = :userId", { postId, userId })
          .execute();

        await tm
          .createQueryBuilder()
          .update(Post)
          .set({ points: () => `points + ${2 * realValue}` })
          .where("id =:id", { id: postId })
          .execute();
      });
    } else if (!updoot) {
      await getConnection().transaction(async (tm) => {
        tm.createQueryBuilder()
          .insert()
          .into(Updoot)
          .values({ userId, postId, value: realValue })
          .execute();
      });
    }

    // await Updoot.insert({
    //   userId,
    //   postId,
    //   value: realValue,
    // });
    // await Post.update({
    //   id: postId,
    // });
    await getConnection().transaction(async (tm) => {
      tm.createQueryBuilder()
        .insert()
        .into(Updoot)
        .values({ userId, postId, value: realValue })
        .execute();

      tm.createQueryBuilder()
        .update(Post)
        .set({ points: () => `points + ${realValue}` })
        .where("id =:id", { id: postId })
        .execute();
    });
    /* await getConnection().query(
      `
      start transaction;

      insert into updoot ("userId","postId", value) values (${userId}, ${postId}, ${realValue});

      update post p
      set p.points = p.points + ${realValue}
      where p.id = ${postId};

      commit;
    `,
      [realValue, postId]
    ); */
    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int!) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: MyContext
  ): // @Arg("info") info: any

  Promise<PaginatedPosts> {
    console.log(req.session, ">>>");

    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;
    const replacements: any[] = [realLimitPlusOne, req.session.userId];
    if (req.session.userId) {
      replacements.push(req.session.userId);
    }
    let cursorIdex = 3;
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
      cursorIdex = replacements.length;
    }
    console.log(replacements);
    let posts = await getConnection()
      .getRepository(Post)
      .createQueryBuilder("p")
      .innerJoinAndSelect("p.creator", "u", "u.id = p.creatorId")
      .take(realLimitPlusOne)
      .getMany();
    // if (cursor) {
    //   qb.where("p.createdAt < :cursor", { cursor: new Date(parseInt(cursor)) });
    // }
    // qb.orderBy("p.createdAt", "DESC");
    // if (realLimitPlusOne) {
    //   qb.limit(realLimitPlusOne);
    // }

    // let posts = await qb.getRawMany();
    console.log(posts, "post >>>");
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
    console.log(input, "input >>");

    return Post.create({ ...input, creatorId: req.session.userId }).save();
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    console.log(title, text, ">>>>", req.session.userId);

    const post = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where("id = :id and creatorId = :creatorId", {
        id,
        creatorId: req.session.userId,
      })
      .execute();
    return post.raw[0];
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<Boolean> {
    /*   const post = await Post.findOne({ where: { id } });
    if (!post) {
      return false;
    }
    if (post.creatorId !== req.session.userId) {
      throw new Error("not authenticated");
    }
    await Updoot.delete({ postId: id });
    await Post.delete({ id });
    return true; */
    await Post.delete({ id, creatorId: req.session.userId });
    return true;
  }
}
