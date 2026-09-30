
const TrackSetting = ({setDragStart, setCurrentDrag, setBoardData, dragStart, currentDrag, closeModal}) => {

    const handleSubmit = (e) => {

        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const eventName = formData.get("eventName");
        const eventDesc = formData.get("eventDesc");

        setBoardData(
            prev => [
                ...prev , 
                {
                    start : Math.min(dragStart, currentDrag),
                    end :  Math.min(dragStart, currentDrag) + Math.abs(dragStart - currentDrag),
                    name: eventName,
                    description: eventDesc
                }
            ]
        )

        setDragStart(null);
        setCurrentDrag(null);
        closeModal();
    }

    return(
        <div className="absolute w-screen h-screen top-0 left-0 z-50 backdrop-blur-sm flex items-center" >
            <form className="bg-white p-20 mx-auto w-fit" onSubmit={handleSubmit}>
                <div>
                    <input type="text" name="eventName"  placeholder="name of the event" />
                </div>
                <div>
                    <input type="text" name="eventDesc" placeholder="description of the event" />
                </div>

                <button type="submit">
                    Add
                </button>
            </form>
        </div>
    );
};

export default TrackSetting;