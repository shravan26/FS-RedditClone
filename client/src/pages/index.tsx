import { withUrqlClient } from "next-urql";
import Layout from "../components/Layout";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";
import {
    Box,
    Button,
    Flex,
    Heading,
    Link,
    Stack,
    Text,
} from "@chakra-ui/react";
import { useState } from "react";
const Index = () => {
    const [variables,setVariables] = useState({limit : 10, cursor : null as string | null})
    const [{ data, fetching }] = usePostsQuery({
        variables
    });
    if(!data && !fetching) {
        return <div>Your query has failed</div>
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
                        <Box p={5} shadow="md" borderWidth="1px" key={post.id}>
                            <Heading fontSize="xl">{post.title}</Heading>
                            <Text>{post.textSnippet}</Text>
                        </Box>
                    ))}
                </Stack>
            ) : (
                <div>loading ...</div>
            )}
            {data && data.posts.hasMore ? (
                <Flex>
                    <Button m="auto" onClick={() => setVariables({
                        limit : 10, 
                        cursor : data.posts.posts[data.posts.posts.length - 1].createdAt,
                    })}
                    isLoading={fetching}
                    >Load More...</Button>
                </Flex>
            ) : null}
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient, {
    ssr: true,
    neverSuspend: true,
})(Index);
