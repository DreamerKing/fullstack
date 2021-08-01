import { InputType, Field } from "type-graphql";

@InputType()
export class UsernamePasswordInput {
  @Field()
  username: string;

  @Field()
  email: string;

  @Field()
  password: string;
}

@InputType()
export class UsernameOrEmailPasswordInput {
  @Field()
  usernameOrEmail: string;

  @Field()
  password: string;
}
