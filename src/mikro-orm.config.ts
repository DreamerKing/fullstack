import { MikroORM } from '@mikro-orm/core';
import { Post } from './entites/Post';
import { User } from './entites/User';
import { __prod__ } from './constants';
import path from 'path';

export default {
    migrations: {
        path: path.join(__dirname, "./migrations"),
        pattern: /^[\w-]+\d+\.[tj]s$/,
    },
    entities: [Post, User],
    dbName: 'lireddit',
    password: '794838927',
    type: "mysql",
    debug: !__prod__
} as Parameters<typeof MikroORM.init>[0];