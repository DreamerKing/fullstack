// import { Entity, PrimaryKey, Property } from '@mikro-orm/core';   
// import { ManyToOne } from '@mikro-orm/core';
import { ObjectType, Field, Int, } from 'type-graphql';
import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Entity,
  BaseEntity,
  ManyToOne
} from "typeorm";

import { User } from './User';

@ObjectType()
@Entity()
export class Post extends BaseEntity {
    @Field(() => Int)
    // @PrimaryKey()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field(() => String)
    // @Property({ type: 'date' })
    @CreateDateColumn()    
    createdAt = new Date();
    
    @Field(() => String)
    // @Property( { type: 'date', onUpdate: () => new Date() })
    @UpdateDateColumn()    
    updatedAt = new Date();

    @Field()
    @Column()    
    // @Property({ type: "text"})
    title!: string;
  
    @Field()
    @Column()
    text!: string;  
  
    @Field()
    @Column()
    creatorId: number;

    @Field()
    @Column({ type: "int", default: 0 })
    points!: number;  
    
    @ManyToOne(() => User, user => user.posts)
    creator: User;

}