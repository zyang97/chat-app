export default function Avatar({online, username, userId}) {
    const colors = ['bg-red-200', 'bg-green-200', 'bg-purple-200', 'bg-yellow-200', 'bg-teal-200'];
    const colorIndex = parseInt(userId, 16) % colors.length;
    const color = colors[colorIndex];
    return (
        <div className={"w-8 h-8 rounded-full relative flex items-center " + color}>
            <div className="text-center w-full opacity-70">
                {username[0]}
            </div>
            {online && 
                (<div className="absolute w-3 h-3 bg-green-400 -bottom-0.5 -right-0.5 rounded-full border border-white"></div>)
            }
            {!online &&
                (<div className="absolute w-3 h-3 bg-gray-400 -bottom-0.5 -right-0.5 rounded-full border border-white"></div>)
            }   
        </div>
    );
}