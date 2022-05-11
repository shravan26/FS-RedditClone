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
            where: { userId,postId },
        });
        console.log('updoot : ',updoot);
        if (updoot && updoot.value !== realValue) {
            console.log('in here');
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
            console.log('else in here');
            await conn.transaction(async (tm) => {
                await tm.query(
                    `
                    insert into updoot("userId", "postId", value)
                    values($1,$2,$3)
                `,
                    [userId, postId, realValue]
                );
                await tm.query(`
                    update post
                    set points = points + $1
                    where id = $2
                `,[realValue, postId]);
            });
        }
        return true;
    }
    @Query(() => PaginatedPosts)
    async posts(
        @Arg("limit", () => Int) limit: number,
        @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
        @Ctx() { conn, req }: MyContext
    ): Promise<PaginatedPosts> {
        const realLimit = Math.min(50, limit);
        const realLimitPlusOne = realLimit + 1;
        const replacements: any[] = [realLimitPlusOne];
        if (req.session.userId) {
            replacements.push(req.session.userId);
        }
        let cursorIdx = 3;
        if (cursor) {
            replacements.push(new Date(parseInt(cursor)));
            cursorIdx = replacements.length;
        }

        const posts = await conn.query(
            `
            select p.*,json_build_object(
                'id', u.id,
                'username',u.username,
                'email',u.email,
                'createdAt',u."createdAt", 
                'updatedAt',u."updatedAt"
                ) creator,
                ${
                    req.session.userId
                        ? `(select value from updoot where "userId" = $2 and "postId" = p.id) "voteStatus"`
                        : `null as "voteStatus"`
                }
                from post p
                inner join public.user u on u.id = p."creatorId"
                ${cursor ? `where p."createdAt" < $${cursorIdx}` : ""}
                order by p."createdAt" DESC
                limit $1
        `,
            replacements
        );
        // const qb = await conn.manager.getRepository(Post).createQueryBuilder("p").orderBy('"createdAt"',"DESC").take(realLimitPlusOne);
        // if(cursor) {
        //     qb.where('"createdAt" < :cursor' , {cursor : new Date(parseInt(cursor))})
        // }
        // const posts = await qb.getMany();
        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === realLimitPlusOne,
        };
    }

    @Query(() => Post, { nullable: true })
    async post(@Arg("id") id: number): Promise<Post | null> {
        const post = await Post.findOneBy({ id: id });
        return post;
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
    async updatePost(
        @Arg("id") id: number,
        @Arg("title") title: string
    ): Promise<Post | null> {
        const post = await Post.findOneBy({ id: id });
        if (!post) {
            return null;
        }
        if (typeof title !== "undefined") {
            post.title = title;
            await Post.update({ id }, { title });
        }
        return post;
    }

    @Mutation(() => Post)
    async deletePost(@Arg("id") id: number): Promise<boolean> {
        await Post.delete(id);
        return true;
    }
    @Mutation(() => Boolean)
    async deletePosts() {
        await Post.delete({});
        return true;
    }
}
