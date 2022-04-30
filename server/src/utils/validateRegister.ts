import { UsernamePasswordInput } from "../resolvers/UsernamePasswordInput";

export const validateRegister = (inputOptions: UsernamePasswordInput) => {
    if (!inputOptions.email.includes("@")) {
        return [
            {
                field: "email",
                message: "Not a valid email address",
            },
        ];
    }
    if (inputOptions.username.length <= 2) {
        return [
            {
                field: "username",
                message: "Username must be at least 3 characters long",
            },
        ];
    }
    if (inputOptions.password.length <= 3) {
        return [
            {
                field: "password",
                message: "Password must be at least 4 characters long",
            },
        ];
    }
    if (inputOptions.username.includes("@")) {
        return [
            {
                field: "username",
                message: "Username cannot contain @",
            },
        ];
    }
    return null;
};
