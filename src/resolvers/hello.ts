import { Resolver, Query } from 'type-graphql';

@Resolver()
export class HelloResover {
    @Query(() => String)
    hello() {
        return 'Hello';
    }
}