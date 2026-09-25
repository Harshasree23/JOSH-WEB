import Heading from "../../../shared/components/Heading";
import StreakGraph from "../../../shared/components/StreakGraph";

export default function DashboardPage() 
{
  return(
    <div>


      <Profile />

      <Heading title="Streak" />

      <StreakGraph />



    </div>
  );
}


const Profile = () => {

  return(
    <div className="flex items-center">
      <div className="w-30 h-30 rounded bg-gray-300">

      </div>
      <Heading title="Sree Harsha" />
    </div>
  );
};