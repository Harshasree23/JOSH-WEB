import { useState } from "react";
import TrackDraft from "./TrackDraft";
import TrackEvent from "./TrackEvent";
import TrackSetting from "./TrackSetting";

const TrackRow = ({ events, date }) => {

    const [dragStart, setDragStart] = useState(null);
    const [currentDrag, setCurrentDrag] = useState(null);

    const [addEvent, setAddEvent] = useState(false);

    const handlePointerDown = (e) => {
        const startX = e.nativeEvent.offsetX ;

        setDragStart(startX);
        setCurrentDrag(startX);
    }

    const handlePointerMove = (e) => {

        if( dragStart == null ) return;

        const currPosition = e.nativeEvent.offsetX;
        setCurrentDrag(currPosition);
    }

    const handlePointerUp = () => {
        
        if(dragStart!=null && currentDrag!=null){
            setAddEvent(true);
        }
        else{
            setDragStart(null);
            setCurrentDrag(null);
        }
    }

    return(
        <div className="flex flex-col gap-1 w-[1440px]">


            {/* Popup for adding a event */}
            {
                addEvent &&
                <TrackSetting 
                    setDragStart={setDragStart} 
                    setCurrentDrag={setCurrentDrag} 
                    dragStart={dragStart} 
                    currentDrag={currentDrag}
                    date={date}
                    closeModal={() => setAddEvent(false)} 
                />
            }

            {/* Existing events */}
            {
                [...events].sort((a,b) => a.start_px - b.start_px).map(
                    (event) => {
                        return(
                            <div key={event.id} className="relative w-full bg-gray-200 h-8" >
                                <TrackEvent 
                                    id={event.id}
                                    start={event.start_px} 
                                    end={event.end_px} 
                                    name={event.name} 
                                    description={event.description} />
                            </div>
                        )
                    }
                )
            }

            {/* For new events */}
            <div className="bg-gray-200 h-8 relative" 
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp} 
                onMouseLeave={handlePointerUp}>
                {
                    currentDrag != null 
                    ?
                    <TrackDraft start={dragStart} end={currentDrag} />
                    :
                    <>
                    </>
                }
            </div>
        </div>
        
    );
};

export default TrackRow;