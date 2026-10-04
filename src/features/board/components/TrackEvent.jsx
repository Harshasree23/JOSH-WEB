import { useBoardStore } from "../stores/boardStore";

const TrackEvent = ({id, start, end, name, description}) => {

    const { deleteEvent } = useBoardStore();
    const leftPos = Math.min(start,end);
    const width = Math.abs(end - start);

    return(
        <div className="bg-gray-600 h-8 text-white font-semibold rounded text-sm flex items-center justify-between px-2 font-kalam absolute group"
            style={{
                left: `${leftPos}px`,
                width: `${width}px`
            }} >
                <span className="truncate">{ name }</span>
                <button
                    onClick={() => deleteEvent(id)}
                    className="opacity-0 group-hover:opacity-100 text-white/70 hover:text-white text-xs ml-1 shrink-0 transition-opacity"
                    title="Remove"
                >
                    ✕
                </button>
        </div>
    );
};

export default TrackEvent;