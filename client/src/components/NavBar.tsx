import { Box, Button, Flex, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import * as React from "react";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";

interface NavBarProps {}

const NavBar: React.FC<NavBarProps> = ({}) => {
    const [{ data, fetching }] = useMeQuery({
        pause : isServer()
    });
    const [{ fetching: logoutFetching }, logout] = useLogoutMutation();

    console.log('data : ', data);
    let body = null;

    //Data not loaded
    if (fetching) {
    }
    //User not logged in
    else if (!data?.me) {
        body = (
            <>  
                {/* <Button onClick={toggleColorMode}>Toggle {colorMode === "light" ? "Dark" : "Light"}</Button>  */}

                <NextLink href={"/login"} passHref>
                    <Link mr={4}>Login</Link>
                </NextLink>
                <NextLink href={"/register"} passHref>
                    <Link>Register</Link>
                </NextLink>
            </>
        );
    }
    //User logged in
    else {
        body = (
            <Flex align="center">
                {/* <Button onClick={toggleColorMode}>{colorMode === "light" ? "Dark" : "Light"}</Button>  */}

                <Box mr={4} ml={4} >{data.me.username}</Box>
                <Button
                    variant="link"
                    onClick={() => {
                        logout();
                    }}
                    isLoading={logoutFetching}
                >
                    Logout
                </Button>
            </Flex>
        );
    }
    return (
        <Flex bg="tomato" p={4} position="sticky" top={0} zIndex={1}>
            <Box ml="auto">{body}</Box>
        </Flex>
    );
};

export default NavBar;
