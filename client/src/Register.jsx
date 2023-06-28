import axios from "axios";
import { useContext, useState } from "react";
import { UserContext } from "./UserContext";
import Logo from "./Logo";


export default function RegisterAndLoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginOrRegister, setIsLoginOrRegister] = useState('register');
    const {setUsername:setLoggedInUsername, setId} = useContext(UserContext);
    async function handleSubmit(ev) {
        const url = isLoginOrRegister === 'register' ? 'register' : 'login';
        ev.preventDefault();
        const data = axios.post('/' + url, {username, password});
        setLoggedInUsername(username);
        setId(data.id);
    }
    return (
        <div className="bg-blue-50 flex flex-col h-screen items-center justify-center">
            <div className="text-blue-600 font-aeril flex flex gap-2 mb-4" style={{'fontSize': 30}}>
                Sign in
            </div>
            <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
                <input value={username} 
                       onChange={ev => setUsername(ev.target.value)} 
                       type="text" 
                       placeholder="username" 
                       className="block w-full rounded-sm p-2 mb-2"/>
                <input value={password}
                       onChange={ev => setPassword(ev.target.value)}
                       type="password" 
                       placeholder="password" 
                       className="block w-full rounded-sm p-2 mb-2"/>
                <button className="bg-blue-500 text-white block w-full rounded-sm p-2">
                    {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
                    </button>
                <div className="text-center mt-2">
                    {
                        isLoginOrRegister === 'register' && (
                            <div>
                                Already a member?&nbsp;
                                <button onClick={() => setIsLoginOrRegister('login')} className="text-blue-700">
                                    Login
                                </button>
                            </div>
                        )
                    }
                    {
                        isLoginOrRegister === 'login' && (
                            <div>
                                Don't have an account?&nbsp;
                                <button onClick={() => setIsLoginOrRegister('register')} className="text-blue-700">
                                    Register
                                </button>
                            </div>
                        )
                    }
                </div>
            </form>
        </div>
    );
}