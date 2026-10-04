import { useState, useEffect } from "react";
import TimelineIndicator from "../components/TimelineIndicator";
import TrackRow from "../components/TrackRow";
import { useBoardStore } from "../stores/boardStore";

const BoardPage = () => {

    const date = new Date();
    const { events, loading, fetchEvents } = useBoardStore();

    useEffect(() => {
        fetchEvents(date);
    }, [fetchEvents]);

    return(
        <div className="">

            {/* Date */}
            <div className="mb-5 font-semibold font-caveat text-2xl text-right">
                { date.getDate() + "-" + ( date.getMonth()+1 ) + "-" + date.getFullYear() }
            </div>
            
            {/* Timeline indicator */}
            <TimelineIndicator />
            
            {/* Event tracks */}
            <TrackRow events={events} date={date} />
        </div>
    );
};

export default BoardPage;