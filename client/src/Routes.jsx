import { useContext } from "react";
import { UserContext } from "./UserContext";
import RegisterAndLoginForm from "./Register";

export default function Routes() {
    const {username, id} = useContext(UserContext);

    if (username) {
        return 'logged in!' + username;
    }
    return (
        <RegisterAndLoginForm />
    );
}