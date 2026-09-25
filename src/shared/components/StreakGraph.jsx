import { useMemo } from "react";


const StreakGraph = () => {

    const streakGraphData = useMemo (
        () => {

            const today = new Date();
            const startDay = new Date();
            startDay.setDate( today.getDate()-365 );
            let days = []

            let paddingDays = today.getDay()%6;
            for( let i=1;i<paddingDays;i++){
                days.push(null);
            }

            for(let i=0;i<366;i++){
                const currentDay = new Date(startDay);
                currentDay.setDate(currentDay.getDate()+i);
                days.push( currentDay );
                
                const tomorrow = new Date(currentDay);
                tomorrow.setDate(tomorrow.getDate()+1);

                if( tomorrow.getDate() == 1 && i<366){
                    for(let j=0;j<14;j++){
                        days.push(null);
                    }
                }
            }

            return days;
        }, []
    );

    return(
        <div className="p-5 border rounded w-fit">

        {/* Streak information */}
        <div className="flex gap-10 mb-7 font-kalam">
            <div className="flex items-center gap-3">
                <div className="text-sm font-light" > Total active days </div>
                <div className="text-sm"> 33 </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="text-sm font-light" > Max streak </div>
                <div className="text-sm"> 3 </div>
            </div>
        </div>
        
        {/* Streak Graph */}
        <div className="grid grid-rows-7 grid-flow-col gap-[1.5px] w-fit ">
            {
                streakGraphData.map(
                    (date, index) => 
                    (
                        date == null ?
                        (<div className="w-3 h-3"/>)
                        :
                        (<div className="w-3 h-3 bg-gray-200"
                            title={date.toDateString()}
                        />)
                    )
                )
            }
        </div>

        </div>
    );
};

export default StreakGraph;