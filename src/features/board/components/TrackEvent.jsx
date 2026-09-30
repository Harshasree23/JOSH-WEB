
const TrackEvent = ({start,end,name,description}) => {

    const leftPos = Math.min(start,end);
    const width = Math.abs(end - start);

    return(
        <div className="bg-gray-600 h-8 text-white font-semibold rounded text-sm flex items-center px-2 font-kalam absolute"
            style={{
                left: `${leftPos}px`,
                width: `${width}px`
            }} >
                { name }
        </div>
    );
};

export default TrackEvent;