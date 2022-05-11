import { ObjectType } from "type-graphql";
import {
    BaseEntity,
    Column, Entity,
    ManyToOne,
    PrimaryColumn
} from "typeorm";
import { Post } from "./Post";
import { User } from "./User";

@ObjectType()
@Entity()
export class Updoot extends BaseEntity {

    @Column({type: "int"})
    value : number;

    @PrimaryColumn()
    userId : number;


    @PrimaryColumn()
    postId : number;

    @ManyToOne(() => Post, (post) => post.updoots)
    post : Post;

    @ManyToOne(() => User, (user) => user.updoots)
    user : User;
    


}