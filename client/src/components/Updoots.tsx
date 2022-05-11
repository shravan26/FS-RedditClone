import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { Flex, IconButton } from "@chakra-ui/react";
import React, { useState } from "react";
import {
    PostInfoFragmentFragment,
    useVoteMutation,
} from "../generated/graphql";

interface UpdootProps {
    post: PostInfoFragmentFragment;
}

const Updoots: React.FC<UpdootProps> = ({ post }) => {
    const [loadingState, setLoadingState] = useState<'updoot-loading'|'downdoot-loading'|'not-loading'>("not-loading")
    const [, vote] = useVoteMutation();
    return (
        <Flex direction="column" align="center" justifyContent="center" mr={4}>
            <IconButton
                onClick={async () => {
                    if (post.voteStatus === 1) {
                        return;
                    }
                    setLoadingState("updoot-loading")
                    await vote({
                        postId: post.id,
                        value: 1,
                    });
                    setLoadingState("not-loading")
                }}
                aria-label="upvote"
                size="xs"
                isLoading={loadingState === "updoot-loading"}
                colorScheme={post.voteStatus === 1 ? "green" : undefined}
                icon={<ChevronUpIcon />}
                
            />
            {post.points}
            <IconButton
                onClick={async () => {
                    if (post.voteStatus === -1) {
                        return;
                    }
                    setLoadingState("downdoot-loading")
                    await vote({
                        postId: post.id,
                        value: -1,
                    });
                    setLoadingState("not-loading")
                }}
                aria-label="downvote"
                size="xs"
                isLoading={loadingState === "downdoot-loading"}
                colorScheme={post.voteStatus === -1 ? "red" : undefined}
                icon={<ChevronDownIcon />}
                
            />
        </Flex>
    );
};

export default Updoots;
