import StreakGraph from "../../../shared/components/StreakGraph"


export default function HabitsPage() 
{
  return(
    <div>
        <HabitItem />
    </div>
  );
};

const HabitItem = () => {

  return(
    <div className="font-bubbler flex flex-col gap-5">
      
      {/* Habit infor */}
      <div className="flex flex-col gap-1">

        <div className="flex justify-between">
          <div className="font-bold text-2xl"> Habit Heading </div>
          <div> Status ? </div>
          <div className="flex gap-10 items-center">
            <div className="border rounded px-2 py-1"> Habit Type </div>
            <div className="border rounded px-2 py-1"> Habit metric </div>
            <div className="rounded w-7 h-7 bg-yellow-300"> </div>
          </div>
        </div>
    
        <div> Here goes the short description of the habit bla bla bla or lorem ipsum or whatever shit you want to write about your habit </div>
        
      </div>
      
      {/* Short streak info ? */}

      {/* Streak info */}
      <div>
        <StreakGraph />
      </div>

    </div>
  )
}
