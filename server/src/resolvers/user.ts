import { User } from "../entities/User";
import { MyContext } from "../types";
import {
    Arg,
    Ctx,
    Field,
    InputType,
    Mutation,
    ObjectType,
    Query,
    Resolver,
} from "type-graphql";
import argon2 from "argon2";

@InputType()
class UsernamePasswordInput {
    @Field()
    username: string;
    @Field()
    password: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}

@ObjectType()
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}

@Resolver()
export class UserResolver {
    @Query(() => [User])
    async getUsers(
        @Ctx() { em }: MyContext
    ): Promise<User[]> {
        const users = await em.find(User, {});
        return users;
    }
    
    @Query(() => User, { nullable : true}) 
    async me( 
        @Ctx() {req,em} : MyContext
    ) : Promise<User | null> {
        if(!req.session.userId) {
            return null;
        }
        const user = await em.findOne(User, {id : req.session.userId});
        return user;
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("inputOptions") inputOptions: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        if(inputOptions.username.length <= 2) {
            return {
                errors : [{
                    field : 'username',
                    message : 'Username must be at least 3 characters long'
                }]
            }
        }
        if(inputOptions.password.length <= 3) {
            return {
                errors : [{
                    field : 'password',
                    message : 'Password must be at least 4 characters long'
                }]
            }
        }
        const hashedPassword = await argon2.hash(inputOptions.password);
        const user = em.create(User, {
            username: inputOptions.username,
            password: hashedPassword,
        });
        try {
            await em.persistAndFlush(user);
            req.session.userId = user.id;
        } catch (error) {
            if(error.code === '23505') {
                return {
                    errors: [
                        {
                            field : "username",
                            message: "Username already taken"
                        }
                    ],
                }
            }
        }
        return {user};
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("inputOptions") inputOptions: UsernamePasswordInput,
        @Ctx() { em,req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, {
            username: inputOptions.username,
        });
        if (!user) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "Could not find the username",
                    },
                ],
            };
        }
        const valid = await argon2.verify(user.password,inputOptions.password);
        if(!valid) {
            return {
                errors : [
                    {
                        field : "password",
                        message : "Not a valid password"
                    }
                ],
            };
        }

        req.session.userId = user.id;

        return {
            user,
        };
    }
}
