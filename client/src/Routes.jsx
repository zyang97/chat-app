import { useContext } from "react";
import { UserContext } from "./UserContext";
import RegisterAndLoginForm from "./Register";
import Chat from "./Chat";

export default function Routes() {
    const {username, id} = useContext(UserContext);

    if (username) {
        return <Chat />
    }
    return (
        <RegisterAndLoginForm />
    );
}