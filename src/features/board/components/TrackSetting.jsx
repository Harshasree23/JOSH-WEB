import { useState } from "react";
import { useBoardStore } from "../stores/boardStore";

const TrackSetting = ({setDragStart, setCurrentDrag, dragStart, currentDrag, date, closeModal}) => {

    const { addEvent } = useBoardStore();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {

        e.preventDefault();
        setSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const eventName = formData.get("eventName");
        const eventDesc = formData.get("eventDesc");

        await addEvent({
            name: eventName,
            description: eventDesc,
            startPx: dragStart,
            endPx: currentDrag,
            date: date,
        });

        setDragStart(null);
        setCurrentDrag(null);
        setSubmitting(false);
        closeModal();
    }

    return(
        <div className="fixed inset-0 w-screen h-screen z-50 backdrop-blur-sm flex items-center" >
            <form className="bg-white p-20 mx-auto w-fit" onSubmit={handleSubmit}>
                <div>
                    <input type="text" name="eventName"  placeholder="name of the event" required />
                </div>
                <div>
                    <input type="text" name="eventDesc" placeholder="description of the event" />
                </div>

                <button type="submit" disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add'}
                </button>
            </form>
        </div>
    );
};

export default TrackSetting;