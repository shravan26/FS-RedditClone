import { Box, Button, Flex } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import * as React from "react";
import InputField from "../components/InputField";
import Layout from "../components/Layout";
import { useCreatePostMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { useIsAuth } from "../utils/useIsAuth";

const CreatePost: React.FC<{}> = ({}) => {
    const router = useRouter();
    const [, createPost] = useCreatePostMutation();
    useIsAuth();
    return (
        <Layout variant="small">
            <Formik
                initialValues={{ title: "", text: "" }}
                onSubmit={async (values) => {
                    const {error} = await createPost({ inputOptions: values });
                    if(!error){
                        router.push("/");
                    }  
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="title"
                            label="Title"
                            placeholder="Title"
                        />
                        <Box mt={4}>
                            <InputField
                                textarea
                                name="text"
                                label="Body"
                                placeholder="Text ..."
                            />
                        </Box>
                        <Flex mt={4} align="center">
                            <Box mr={2}>
                                <Button
                                    colorScheme="teal"
                                    isLoading={isSubmitting}
                                    type="submit"
                                >
                                    Create post
                                </Button>
                            </Box>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient)(CreatePost);
