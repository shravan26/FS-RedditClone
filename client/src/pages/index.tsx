import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    Flex,
    Heading,
    IconButton,
    Link,
    Stack,
    Text,
} from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import { useState } from "react";
import Layout from "../components/Layout";
import Updoots from "../components/Updoots";
import {
    useDeletePostsMutation,
    useMeQuery,
    usePostsQuery,
} from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
const Index = () => {
    const [variables, setVariables] = useState({
        limit: 10,
        cursor: null as string | null,
    });
    const [{ data: meData }] = useMeQuery();
    const [{ data, fetching }] = usePostsQuery({
        variables,
    });
    const [, deletePosts] = useDeletePostsMutation();
    if (!data && !fetching) {
        return <div>Your query has failed</div>;
    }
    return (
        <Layout variant="regular">
            <Flex align="center">
                <Heading>LiReddit</Heading>
                <NextLink href="/create-post">
                    <Link ml="auto">Create new post</Link>
                </NextLink>
            </Flex>

            {data && !fetching ? (
                <Stack spacing={8}>
                    {data.posts.posts.map((post) =>
                        !post ? null : (
                            <Flex
                                p={5}
                                shadow="md"
                                borderWidth="1px"
                                key={post.id}
                                align="center"
                            >
                                <Updoots post={post} />
                                <Box ml={4}>
                                    <NextLink
                                        href="/post/[id]"
                                        as={`/post/${post.id}`}
                                    >
                                        <Link>
                                            <Heading fontSize="xl">
                                                {post.title}
                                            </Heading>
                                        </Link>
                                    </NextLink>
                                    <Text fontSize="sm">
                                        posted by {post.creator.username}
                                    </Text>
                                    <Text>{post.textSnippet}</Text>
                                </Box>
                                <Box ml="auto">
                                    <Flex align="center">
                                        <NextLink
                                        href="/post/edit/[id]"
                                        as={`/post/edit/${post.id}`}
                                    >
                                        <Link>
                                            <IconButton
                                                icon={<EditIcon />}
                                                aria-label="Edit post"
                                                display={
                                                    meData?.me?.id ===
                                                    post.creator.id
                                                        ? "block"
                                                        : "none"
                                                }
                                            />
                                        </Link>
                                    </NextLink>

                                    <IconButton
                                        icon={<DeleteIcon />}
                                        aria-label="Delete post"
                                        onClick={() => {
                                            deletePosts({ id: post.id });
                                        }}
                                        display={
                                            meData?.me?.id === post.creator.id
                                                ? "block"
                                                : "none"
                                        }
                                    />
                                    </Flex>
                                </Box>
                                    
                            </Flex>
                        )
                    )}
                </Stack>
            ) : (
                <div>loading ...</div>
            )}
            {data && data.posts.hasMore ? (
                <Flex>
                    <Button
                        m="auto"
                        onClick={() =>
                            setVariables({
                                limit: 10,
                                cursor: data.posts.posts[
                                    data.posts.posts.length - 1
                                ].createdAt,
                            })
                        }
                        isLoading={fetching}
                    >
                        Load More...
                    </Button>
                </Flex>
            ) : null}
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient, {
    ssr: true,
    neverSuspend: true,
})(Index);
