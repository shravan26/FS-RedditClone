import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import Layout from "../../components/Layout";
import { usePostQuery } from "../../generated/graphql";
import { createUrqlClient } from "../../utils/createUrqlClient";
// interface PostProps {
//     post : PostInfoFragmentFragment
// }

const Post: React.FC<{}> = ({}) => {
    const router = useRouter();
    const _id =
        typeof router.query.id === "string" ? parseInt(router.query.id) : -1;
    const [{ fetching, data }] = usePostQuery({ variables: { id: _id } });
    if (fetching) {
        return (
            <Layout variant="regular">
                <Stack>
                    <Box shadow="md" borderWidth="1px" padding={6}>
                        Loading...
                    </Box>
                </Stack>
            </Layout>
        );
    }
    if (!data?.post) {
        return (
            <Layout variant="regular">
                <Stack>
                    <Box shadow="md" borderWidth="1px" padding={6}>
                        Could not find post
                    </Box>
                </Stack>
            </Layout>
        );
    }
    return (
        <Layout variant="regular">
            <Stack spacing={8}>
                <Flex p={5} shadow="md" borderWidth="1px" padding={6}>
                    <Box>
                        <Heading fontSize="xl">{data.post.title}</Heading>
                        <Text fontSize="sm">
                            posted by {data.post.creator.username}
                        </Text>
                        <Text>{data.post.text}</Text>
                    </Box>
                </Flex>
            </Stack>
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient, {
    ssr: true,
    neverSuspend: true,
})(Post);
