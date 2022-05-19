import DataLoader from "dataloader";
import { Updoot } from "../entities/Updoot";

export const createUpdootLoader = () => new DataLoader<{postId : number, userId : number},Updoot | null>(
    async (keys) => {
        const updoots = await Updoot.findBy(keys as any);
        const updootIdToUpdoots : Record<string,Updoot> = {};
        updoots.forEach((updoot) => {
            updootIdToUpdoots[`${updoot.postId}|${updoot.userId}`] = updoot;
        });
        return keys.map(key => updootIdToUpdoots[`${key.postId}|${key.userId}`]);
    }
);