// import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
// import { OneToMany } from "@mikro-orm/core";
import { ObjectType, Field, Int } from "type-graphql";
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  Entity,
  OneToMany,
  BaseEntity,
} from "typeorm";

import { Post } from "./Post";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  // @PrimaryKey()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  // @Property({ type: "date" })
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  // @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt = new Date();

  @Field()
  // @Property({ type: "text", unique: true })
  @Column()
  username!: string;
  // text 类型不支持唯一性约束

  @Field()
  // @Property({ type: "text", unique: true })
  @Column({ unique: true })
  email!: string;

  @Field(() => String)
  @Column({ unique: true })
  // @Property({ type: "text" })
  password!: string;

  @OneToMany(() => Post, (post) => post.creator)
  posts: Post[];
}
