

const TimelineIndicator = ( ) => {

    return(
        <div className="w-[1440px] flex mb-2">
            {
                Array.from({length:24}, (_,index) => {
                    return(
                        <div key={index} className="flex-1 text-xs font-gray-200">
                            {index + ":00"}
                        </div>
                    );
                    }
                )
            }
        </div>
    );
};

export default TimelineIndicator;