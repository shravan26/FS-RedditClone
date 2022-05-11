import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
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
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
const Index = () => {
    const [variables, setVariables] = useState({
        limit: 10,
        cursor: null as string | null,
    });
    const [{ data, fetching }] = usePostsQuery({
        variables,
    });
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
                    {data.posts.posts.map((post) => (
                        <Flex p={5} shadow="md" borderWidth="1px" key={post.id}>
                            <Updoots post={post} />
                            <Box>
                                <Heading fontSize="xl">{post.title}</Heading>
                                <Text fontSize="sm">
                                    posted by {post.creator.username}
                                </Text>
                                <Text>{post.textSnippet}</Text>
                            </Box>
                        </Flex>
                    ))}
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
