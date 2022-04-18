// import { Box } from "@chakra-ui/react";
// import React from "react";

// // export type WrapperVariant = "regular" | "small";
// interface WrapperProps {
//     variant?: 'small' | 'regular' ;
// }

// const Wrapper: React.FC<WrapperProps> = ({ children, variant = "regular" }) => {
//     return (
//         <Box
//             maxW={variant === "regular" ? "800px" : "400px"}
//             w="100%"
//             mt={8}
//             mx="auto"
//         >
//             {children}
//         </Box>
//     );
// };

// export default Wrapper;

import React from "react";
import { Box } from "@chakra-ui/react";

interface WrapperProps {
  variant?: "small" | "regular";
}

export const Wrapper: React.FC<WrapperProps> = ({
  children,
  variant = "regular",
}) => {
  return (
    <Box
      mt={8}
      mx="auto"
      maxW={variant === "regular" ? "800px" : "400px"}
      w="100%"
    >
      {children}
    </Box>
  );
};