import Avatar from "./Avatar";

export default function Contact({id, username, selected, onClick, online}) {
    return (
        <div key={id} onClick={() => onClick(id)} className={"border-b border-gray-200 py-2 flex items-center gap-4 cursor-pointer " + (selected ? "bg-gray-300" : "bg-gray-100")}>
            {selected && (
                <div className="w-1 bg-blue-500 h-12 rounded-r-md"></div>
            )}
            <div className="flex gap-2 py-2 pl-2 items-center"></div>
            <Avatar online={online} username={username} userId={id}/>
            <span className="text-gray-700">
                {username}
            </span>
        </div>
    );
}