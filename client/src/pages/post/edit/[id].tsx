import { EditIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React, { useState } from "react";
import InputField from "../../../components/InputField";
import Layout from "../../../components/Layout";
import {
    usePostQuery,
    useUpdatePostMutation,
} from "../../../generated/graphql";
import { createUrqlClient } from "../../../utils/createUrqlClient";

const EditPost = ({}) => {
    const router = useRouter();
    const _id =
        typeof router.query.id === "string" ? parseInt(router.query.id) : -1;
    const [{ data, fetching }] = usePostQuery({ variables: { id: _id } });
    const [, updatePost] = useUpdatePostMutation();
    const [editable, setEditable] = useState(false);

    if (!data?.post) {
        return (
            <Layout variant="regular">
                <Stack>
                    <Box shadow="md" borderWidth="1px">
                        Could not find post
                    </Box>
                </Stack>
            </Layout>
        );
    }
    if (fetching) {
        <Layout variant="regular">
            <Stack>...Loading</Stack>
        </Layout>;
    }
    return (
        <Layout variant="regular">
            {editable === false ? (
                <Stack>
                    <Flex borderWidth="1px" shadow="md" padding={6}>
                        <Flex direction="column">
                            <Heading>{data.post.title}</Heading>
                            <Text>{data.post.text}</Text>
                        </Flex>
                        <Box
                            ml="auto"
                            my="auto"
                            cursor="pointer"
                            onClick={() => {
                                setEditable(!editable);
                            }}
                        >
                            <EditIcon />
                        </Box>
                    </Flex>
                </Stack>
            ) : (
                <Stack>
                    <Flex borderWidth="1px" shadow="md" padding={6}>
                        <Formik
                            initialValues={{
                                id: data.post.id,
                                title: data.post.title,
                                text: data.post.text,
                            }}
                            onSubmit={async (values) => {
                                const { error } = await updatePost({
                                    id: values.id,
                                    title: values.title,
                                    text: values.text,
                                });
                                if (!error) {
                                    router.push("/");
                                }
                            }}
                        >
                            {({ isSubmitting }) => (
                                <Form>
                                    <Flex direction="column">
                                        <InputField
                                            label="Title"
                                            name="title"
                                        />
                                        <InputField
                                            label="Text"
                                            name="text"
                                            textarea
                                        />
                                    </Flex>

                                    <Box mt={2} float="right">
                                        <Button
                                            colorScheme="teal"
                                            disabled={!editable}
                                            type="submit"
                                            isLoading={isSubmitting}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            colorScheme="red"
                                            ml={2}
                                            onClick={() => {
                                                setEditable(false);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </Box>
                                </Form>
                            )}
                        </Formik>
                    </Flex>
                </Stack>
            )}
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient)(EditPost);
