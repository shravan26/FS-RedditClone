import React from "react";
import { Form, Formik } from "formik";
import { Box, Button, FormControl, FormLabel, Input } from "@chakra-ui/react";
import { Wrapper } from "../components/Wrapper";
import InputField from "../components/InputField";

interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
    return (
        <Wrapper variant="small">
            <Formik
                initialValues={{ username: "", password: "" }}
                onSubmit={(values) => {
                    console.log(values);
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="username"
                            label="Username"
                            placeholder="Username"
                        />
                        <Box mt={4}>
                            <InputField
                                name="password"
                                label="Password"
                                placeholder="Password"
                                type="password"
                            />
                        </Box>
                        <Box mt={4}>
                            <Button type="submit" isLoading={isSubmitting} colorScheme="teal">Register</Button>
                        </Box>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
};

export default Register;
