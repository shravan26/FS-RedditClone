import { MyContext } from "../types";
import { Arg, Ctx, Field, FieldResolver, Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { Post } from "../entities/Post";
import { PostInput } from "./PostInput";
import { isAuth } from "../middleware/isAuth";

@ObjectType()
class PaginatedPosts {
    @Field(() => [Post])
    posts : Post[];
    @Field()
    hasMore : boolean; 
}

@Resolver(Post)
export class PostResolver {
    @FieldResolver(() => String)
    textSnippet(@Root() post:Post){
        return post.text.slice(0, 50);
    }

    @Query(() => PaginatedPosts)
    async posts(
        @Arg ("limit", () => Int) limit : number,
        @Arg ("cursor", () => String, { nullable: true}) cursor : string | null,
        @Ctx() {conn} : MyContext
    ): Promise<PaginatedPosts> {
        const realLimit = Math.min(50,limit);
        const realLimitPlusOne = realLimit + 1;
        const qb = await conn.manager.getRepository(Post).createQueryBuilder("p").orderBy('"createdAt"',"DESC").take(realLimitPlusOne);
        if(cursor) { 
            qb.where('"createdAt" < :cursor' , {cursor : new Date(parseInt(cursor))})
        }
        const posts = await qb.getMany();
        return {posts : posts, hasMore : posts.length === realLimitPlusOne};
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
        return Post.create({
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
