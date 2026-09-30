
const TrackDraft = ({start,end}) => {

    const leftPos = Math.min(start, end);
    const boxWidth = Math.abs(end - start);

    return(
        <div className={`absolute h-full rounded bg-gray-400`}
            style={{
                left: `${leftPos}px`,
                width: `${boxWidth}px`
            }}>
        </div>
    );
};

export default TrackDraft;