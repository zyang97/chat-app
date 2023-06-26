import Avatar from "./Avatar";

export default function Contact({id, username, selected, onClick, online}) {
    return (
        <div key={id} onClick={() => onClick(id)} className={"border-b border-gray-300 py-2 flex items-center gap-4 " + (selected ? "bg-gray-300" : "bg-gray-100")}>
            <Avatar online={online} username={username} userId={id}/>
            <span className="text-gray-700">
                {username}
            </span>
        </div>
    );
}