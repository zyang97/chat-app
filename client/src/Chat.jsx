import { useContext, useEffect, useState } from "react"
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext";

export default function Chat() {
    const [ws, setWs] = useState(null);
    const [onlinePeople, setOnlinePeople] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newMessageText, setNewMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const {username, id} = useContext(UserContext);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:4040');
        setWs(ws);
        ws.addEventListener('message', handleMessage);
    }, [selectedUserId]);

    function showOnlinePeople(peopleList) {
        const people = {};
        peopleList.forEach(({userId, username}) => {
            if (userId) {
                people[userId] = username;
            }
        });
        // delete people[id];
        setOnlinePeople(people);
    }

    function handleMessage(ev) {
        const data = JSON.parse(ev.data);
        if ('online' in data) {
            showOnlinePeople(data.online);
        } else if ('text' in data) {
            setMessages(prev => ([...prev, {text: data.text, isOur: false}]));
        }


    }

    function selectContact(userId) {
        setSelectedUserId(userId);
    }

    function sendMessage(ev) {
        ev.preventDefault();
        ws.send(JSON.stringify({
            recipient: selectedUserId,
            text: newMessageText,
        }))
        setNewMessageText('');
        setMessages(prev => ([...prev, {text: newMessageText, isOur: true}]));
    }

    console.log('Current user: ' + username);
    const onlinePeopleExclOurUser = {...onlinePeople};
    delete onlinePeopleExclOurUser[id];

    return (
        <div className="flex h-screen">
            <div className="bg-gray-100 w-1/3 pl-4 pt-4">
                <Logo />
                {Object.keys(onlinePeopleExclOurUser).map(userId => (
                    <div key={userId} onClick={() => selectContact(userId)} className={"border-b border-gray-300 py-2 flex items-center gap-4 " + (selectedUserId === userId ? "bg-gray-300" : "bg-gray-100")}>
                        <Avatar username={onlinePeopleExclOurUser[userId]} userId={userId}/>
                        <span className="text-gray-700">
                            {onlinePeopleExclOurUser[userId]}
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
                    {/* Show messages. */}
                    {
                        !!selectedUserId && (
                            <div>
                                {
                                    messages.map(message => (
                                        <div>
                                            {message.text}
                                        </div>
                                    ))
                                }
                            </div>
                        )
                    }
                </div>
                {!!selectedUserId && (
                    <form className="flex gap-2" onSubmit={sendMessage}>
                        <input 
                            type="text" 
                            value={newMessageText}
                            onChange={ev => setNewMessageText(ev.target.value)}
                            placeholder="Type your message here." 
                            className="bg-white flex-grow border rounded-sm p-2" />
                        <button type="submit" className="bg-blue-500 p-2 text-white rounded-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}