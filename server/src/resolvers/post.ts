import { MyContext } from "../types";
import {
    Arg,
    Ctx,
    Field,
    FieldResolver,
    Int,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    Root,
    UseMiddleware,
} from "type-graphql";
import { Post } from "../entities/Post";
import { PostInput } from "./PostInput";
import { isAuth } from "../middleware/isAuth";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";

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
    async voteStatus(@Root() post:Post, @Ctx() {updootLoader,req} : MyContext) {
        if(!req.session.userId) {
            return null;
        }
        const updoot = await updootLoader.load({postId : post.id, userId : req.session.userId});
        return updoot ? updoot.value : null;
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
        @Arg("postId", () => Int) postId: number,
        @Arg("value", () => Int) value: number,
        @Ctx() { req, conn }: MyContext
    ): Promise<Boolean> {
        const userId = req.session.userId;
        const isUpdoot = value !== -1;
        const realValue = isUpdoot ? 1 : -1;
        //2 possible conditions with voteStatus -> user already voted and wants to change vote, user has never voted yet.
        const updoot = await Updoot.findOne({
            where: { userId, postId },
        });
        console.log("updoot : ", updoot);
        if (updoot && updoot.value !== realValue) {
            await conn.transaction(async (tm) => {
                await tm.query(
                    `
                update updoot 
                set value = $1
                where "postId" = $2 and "userId" = $3  
            `,
                    [realValue, postId, userId]
                );
                await tm.query(
                    `
                update post
                set points = points + $1
                where id = $2
            `,
                    [2 * realValue, postId]
                );
            });
        } else if (!updoot) {
            await conn.transaction(async (tm) => {
                await tm.query(
                    `
                    insert into updoot("userId", "postId", value)
                    values($1,$2,$3)
                `,
                    [userId, postId, realValue]
                );
                await tm.query(
                    `
                    update post
                    set points = points + $1
                    where id = $2
                `,
                    [realValue, postId]
                );
            });
        }
        return true;
    }
    @Query(() => PaginatedPosts)
    async posts(
        @Arg("limit", () => Int) limit: number,
        @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
        @Ctx() { conn }: MyContext
    ): Promise<PaginatedPosts> {
        const realLimit = Math.min(50, limit);
        const realLimitPlusOne = realLimit + 1;
        const replacements: any[] = [realLimitPlusOne];
        if (cursor) {
            replacements.push(new Date(parseInt(cursor)));
        }

        const posts = await conn.query(
            `
            select p.*
                from post p
                ${cursor ? `where p."createdAt" < $2` : ""}
                order by p."createdAt" DESC
                limit $1
        `,
            replacements
        );
        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === realLimitPlusOne,
        };
    }

    @Query(() => Post, { nullable: true })
    async post(@Arg("id", () => Int) id: number): Promise<Post | null> {
        const post = await Post.find({
            where: { id: id },
            relations: ["creator"],
        });
        return post[0];
    }

    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg("inputOptions") inputOptions: PostInput,
        @Ctx() { req }: MyContext
    ): Promise<Post> {
        return await Post.create({
            ...inputOptions,
            creatorId: req.session.userId,
        }).save();
    }

    @Mutation(() => Post, { nullable: true })
    @UseMiddleware(isAuth)
    async updatePost(
        @Arg("id", () => Int) id: number,
        @Arg("title") title: string,
        @Arg("text") text: string,
        @Ctx() { conn, req }: MyContext
    ): Promise<Post | null> {
        const post = await conn
            .createQueryBuilder()
            .update(Post)
            .set({
                title: title,
                text: text,
            })
            .where('id = :id and "creatorId" = :creatorId', {
                id: id,
                creatorId: req.session.userId,
            })
            .returning("*")
            .execute();

        return post.raw[0];
    }

    @Mutation(() => Post)
    async deletePost(@Arg("id") id: number): Promise<boolean> {
        await Post.delete(id);
        return true;
    }
    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deletePosts(
        @Arg("id", () => Int) id: number,
        @Ctx() { req }: MyContext
    ): Promise<Boolean> {
        //No cascade way
        const post = await Post.findOneBy({ id: id });
        if (!post) {
            return false;
        }
        if (post.creatorId !== req.session.userId) {
            throw new Error("Not Authenticated");
        }
        await Updoot.delete({ postId: id });
        await Post.delete({ id: id });
        return true;
    }
}
