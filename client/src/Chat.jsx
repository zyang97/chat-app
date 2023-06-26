import { useContext, useEffect, useRef, useState } from "react"
import Logo from "./Logo";
import { UserContext } from "./UserContext";
import {uniqBy} from 'lodash';
import axios from "axios";
import Contact from "./Contact";

export default function Chat() {
    const [ws, setWs] = useState(null);
    const [onlinePeople, setOnlinePeople] = useState({});
    const [offlinePeople,setOfflinePeople] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newMessageText, setNewMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const {username, id} = useContext(UserContext);
    const newMessageRef = useRef();

    // Connect to WebSocket,
    useEffect(() => {
        connectToWs();
    }, [selectedUserId]);

    // Scroll down to the bottom when new messages coming.
    useEffect(() => {
        const div = newMessageRef.current;
        if (div) {
            div.scrollIntoView({behavior:'smooth', block:'end'});
        }
    }, [messages]);

    // Load history messages of current user with the selected user from dataset.
    useEffect(() => {
        if (selectedUserId) {
            axios.get('/messages/'+selectedUserId).then(res => {
                setMessages(res.data);
            });
        }
    }, [selectedUserId]);

    // Load all offline people.
    useEffect(() => {
        axios.get('/people').then(res => {
            const offlinePeopleArr = res.data
                .filter(p => p._id !== id)
                .filter(p => !Object.keys(onlinePeople).includes(p._id));
            const offlinePeople = {};
            offlinePeopleArr.forEach(p => {
                offlinePeople[p._id] = p;
            });
            setOfflinePeople(offlinePeople);
        });
    }, [onlinePeople]);

    // connectToWs() connects the WebSocket.
    function connectToWs() {
        const ws = new WebSocket('ws://localhost:4040');
        setWs(ws);
        ws.addEventListener('message', handleMessage);
        ws.addEventListener('close', () => {
            setTimeout(() => {
                console.log('Disconnected. Trying to reconnect...');
                connectToWs();
            }, 1000);
        });
    }

    // showOnlinePeople() lists all the people that are online.
    function showOnlinePeople(peopleList) {
        const people = {};
        peopleList.forEach(({userId, username}) => {
            if (userId) {
                people[userId] = username;
            }
        });
        setOnlinePeople(people);
    }

    // handleMessage() receives the messages from others.
    function handleMessage(ev) {
        const data = JSON.parse(ev.data);
        if ('online' in data) {
            showOnlinePeople(data.online);
        } else if ('text' in data) {
            setMessages(prev => ([...prev, {...data}]));
        }


    }

    // selectContact() set the contact to be selected.
    function selectContact(userId) {
        setSelectedUserId(userId);
    }

    // sendMessage() sends the messages to other contacts.
    function sendMessage(ev) {
        ev.preventDefault();
        ws.send(JSON.stringify({
            recipient: selectedUserId,
            text: newMessageText,
        }))
        setNewMessageText('');
        setMessages(prev => ([...prev, {
            text: newMessageText, 
            sender: id, 
            recipient: selectedUserId,
            _id: Date.now(),
        }]));
    }

    // Remove duplicate online contacts and the user himself.
    const onlinePeopleExclOurUser = {...onlinePeople};
    delete onlinePeopleExclOurUser[id];

    // Remove the duplicate messages by '_id'.
    const messagesNoDup = uniqBy(messages, '_id');

    // console.log('offline: ', offlinePeople);

    return (
        <div className="flex h-screen">
            <div className="bg-gray-100 w-1/3 pl-4 pt-4">
                <Logo />
                {Object.keys(onlinePeopleExclOurUser).map(userId => (
                    <Contact 
                        key={userId}
                        id={userId} 
                        username={onlinePeopleExclOurUser[userId]}
                        selected={userId === selectedUserId}
                        onClick={() => setSelectedUserId(userId)}
                        online={true}/>
                ))}
                {Object.keys(offlinePeople).map(userId => (
                    <Contact 
                        key={userId}
                        id={userId} 
                        username={offlinePeople[userId].username}
                        selected={userId === selectedUserId}
                        onClick={() => setSelectedUserId(userId)}
                        online={false}/>
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
                    { // Show messages.
                        !!selectedUserId && (
                            <div className="relative h-full">
                                <div className="absolute overflow-y-scroll inset-0">
                                    {messagesNoDup.map(message => (
                                        <div key={message._id} className={message.sender === id ? "text-right" : "text-left"}>
                                            <div className={"text-left inline-block p-2 m-2 rounded-md " + (message.sender === id ? "bg-green-500" : "bg-gray-200")}>
                                                {message.text}
                                            </div>
                                        </div>
                                     ))}
                                    <div ref={newMessageRef}></div>
                                </div>
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