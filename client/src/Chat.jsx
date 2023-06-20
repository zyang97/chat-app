import { useContext, useEffect, useState } from "react"
import Avartar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext";

export default function Chat() {
    const [ws, setWs] = useState(null);
    const [onlinePeople, setOnlinePeople] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newMsgText, setNewMsgText] = useState('');
    const {username, id} = useContext(UserContext);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:4040/');
        setWs(ws);
        ws.addEventListener('message', handleMessage);
    }, []);

    function showOnlinePeople(peopleList) {
        const people = {};
        peopleList.forEach(({userId, username}) => {
            people[userId] = username;
        });
        delete people[id];
        setOnlinePeople(people);
    }

    function handleMessage(ev) {
        const data = JSON.parse(ev.data);
        if ('online' in data) {
            showOnlinePeople(data.online);
        }
    }

    function selectContact(userId) {
        setSelectedUserId(userId);
    }

    function sendMsg(ev) {
        ev.preventDefault();
        ws.send(JSON.stringify({
            message: {
                recipient: selectedUserId,
                text: newMsgText,
            }
        }))
    }

    return (
        <div className="flex h-screen">
            <div className="bg-gray-100 w-1/3 pl-4 pt-4">
                <Logo />
                {Object.keys(onlinePeople).map(userId => (
                    <div key={userId} onClick={() => selectContact(userId)} className={"border-b border-gray-300 py-2 flex items-center gap-4 " + (selectedUserId === userId ? "bg-gray-300" : "bg-gray-100")}>
                        <Avartar username={onlinePeople[userId]} userId={userId}/>
                        <span className="text-gray-700">
                            {onlinePeople[userId]}
                        </span>
                    </div>
                ))}
                </div>
            <div className="flex flex-col bg-white-100 w-2/3 p-2">
                <div className="flex-grow">
                    {
                        !selectedUserId && (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-gray-400"> 
                                    &larr; Select a person to start chatting!
                                </div>
                            </div>
                        )
                    }
                </div>
                {!!selectedUserId && (
                    <div className="flex gap-2" onSubmit={sendMsg}>
                    <input 
                        type="text" 
                        value={newMsgText}
                        onChange={ev => setNewMsgText(ev.target.value)}
                        placeholder="Type your message here." 
                        className="bg-white flex-grow border rounded-sm p-2">
                    </input>
                    <button type="submit" className="bg-blue-500 p-2 text-white rounded-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                    </button>
                </div>
                )}
            </div>
        </div>
    )
}