import { Box } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import NavBar from "../components/NavBar";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
    const [{ data }] = usePostsQuery();
    return (
        <>
            <Box>
                <NavBar />
                {data
                    ? data.posts.map((post) => (
                          <div key={post.id}>{post.title}</div>
                      ))
                    : <div>loading ...</div>}
            </Box>
        </>
    );
};

export default withUrqlClient(createUrqlClient, {ssr : true , neverSuspend : true})(Index);