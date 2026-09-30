import { useState } from "react";
import TimelineIndicator from "../components/TimelineIndicator";
import TrackRow from "../components/TrackRow";

const BoardPage = () => {

    const date = new Date();

    const [boardData,setBoardData] = useState([
        {
            start: 30,
            end: 400,
            name: "Bull Shit",
            description: "Dog Shit",
        }
    ]);

    return(
        <div className="">

            {/* Date */}
            <div className="mb-5 font-semibold font-caveat text-2xl text-right">
                { date.getDate() + "-" + ( date.getMonth()+1 ) + "-" + date.getFullYear() }
            </div>
            
            {/* Timeline indicator */}
            <TimelineIndicator />
            
            {/* Event tracks */}
            <TrackRow boardData={boardData} setBoardData={setBoardData} />
        </div>
    );
};

export default BoardPage;