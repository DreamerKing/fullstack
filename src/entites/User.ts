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
import { Updoot } from "./Updoot";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt = new Date();

  @Field()
  @Column()
  username!: string;
  // text 类型不支持唯一性约束

  @Field()
  @Column({ unique: true })
  email!: string;

  @Field(() => String)
  @Column({ unique: true })
  password!: string;

  @OneToMany(() => Updoot, (updoot) => updoot.user)
  updoots: Updoot[];

  @OneToMany(() => Post, (post) => post.creator)
  posts: Post[];
}
