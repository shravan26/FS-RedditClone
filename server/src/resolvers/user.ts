import { User } from "../entities/User";
import { MyContext } from "../types";
import {
    Arg,
    Ctx,
    Field,
    FieldResolver,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    Root,
} from "type-graphql";
import argon2 from "argon2";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../constants";
import { sendMail } from "../utils/sendMail";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { v4 } from "uuid";

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

@Resolver(User)
export class UserResolver {
    @FieldResolver(() => String)
    email(@Root() user: User, @Ctx() {req} : MyContext){
        if(user.id === req.session.userId){
            return user.email;
        }
        else{
            return "";
        }
    }
    @Mutation(() => UserResponse)
    async changePassword(
        @Arg("token") token: string,
        @Arg("newPassword") newPassword: string,
        @Ctx() { redis, req }: MyContext
    ): Promise<UserResponse> {
        if (newPassword.length <= 2) {
            return {
                errors: [
                    {
                        field: "newPassword",
                        message: "length must be greater than 2",
                    },
                ],
            };
        }
        const key = FORGOT_PASSWORD_PREFIX + token;
        const userId = await redis.get(key);
        if (!userId) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "Token has expired",
                    },
                ],
            };
        }
        const userIdNum = parseInt(userId);
        const user = await User.findOneBy({ id: userIdNum });
        if (!user) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "User no longer exits",
                    },
                ],
            };
        }

        await User.update(
            { id: userIdNum },
            {
                password: await argon2.hash(newPassword),
            }
        );
        await redis.del(key);
        //Login user after password change
        req.session.userId = user.id;
        return {
            user,
        };
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string,
        @Ctx() { redis }: MyContext
    ) {
        const user = await User.findOneBy({ email: email });
        if (!user) {
            return true;
        }

        const token = v4();
        await redis.set(
            FORGOT_PASSWORD_PREFIX + token,
            user.id,
            "PX",
            1000 * 60 * 60 * 24 * 3
        );
        await sendMail(
            user?.email,
            `<a href="http://localhost:3000/change-password/${token}">Change Password</a>`
        );
        return true;
    }

    @Query(() => [User])
    async getUsers(): Promise<User[]> {
        const users = await User.find();
        return users;
    }

    @Query(() => User, { nullable: true })
    async me(@Ctx() { req }: MyContext): Promise<User | null> {
        if (!req.session.userId) {
            return null;
        }
        const user = await User.findOneBy({ id: req.session.userId });
        return user;
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("inputOptions") inputOptions: UsernamePasswordInput,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister(inputOptions);
        if (errors) {
            return { errors };
        }
        const hashedPassword = await argon2.hash(inputOptions.password);
        let user;
        try {
            user = await User.create({
                username: inputOptions.username,
                email: inputOptions.email,
                password: hashedPassword,
            }).save();
        } catch (error) {
            console.log(error);
            if (error.code === "23505") {
                return {
                    errors: [
                        {
                            field: "username",
                            message: "Username already taken",
                        },
                        {
                            field: "email",
                            message: "Email already taken",
                        },
                    ],
                };
            }
        }
        req.session.userId = user?.id;
        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const user = await User.findOneBy(
            usernameOrEmail.includes("@")
                ? {
                      email: usernameOrEmail,
                  }
                : { username: usernameOrEmail }
        );
        if (!user) {
            return {
                errors: [
                    {
                        field: "usernameOrEmail",
                        message: "Could not find the username or Emails",
                    },
                ],
            };
        }
        const valid = await argon2.verify(user.password, password);
        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "Not a valid password",
                    },
                ],
            };
        }

        req.session.userId = user.id;

        return {
            user,
        };
    }
    @Mutation(() => Boolean)
    logout(@Ctx() { req, res }: MyContext) {
        return new Promise((resolve) =>
            req.session.destroy((err) => {
                res.clearCookie(COOKIE_NAME);
                if (err) {
                    console.log(err);
                    resolve(false);
                    return;
                }
                resolve(true);
            })
        );
    }
}
