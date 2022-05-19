import DataLoader from "dataloader";
import { In } from "typeorm";
import { User } from "../entities/User";

//Idea is to make sure that we write lesser SQL commands by batching all the sql commands using DataLoader.
export const createUserLoader = () => new DataLoader<number,User>(async (userIds) => {
    const users = await User.findBy({id : In(userIds as number[])});
    const userIdToUser : Record<number,User> = {}; 
    users.forEach((u)=> {
        userIdToUser[u.id] = u;
    });
    return userIds.map((userId) => userIdToUser[userId]);
})