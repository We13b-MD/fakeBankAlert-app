import MainGrid from "./MainGrid";
import StatsRow from "./StatsCard";
import RecentAlerts from "./RecentAlerts";
import DetectText from "../DetectText";
import DetectImage from "../DetectImage";
import AlertDetails from "./AlertDetails";

export default function Dashboard() {
  return (
    <div className="p-6">
      <StatsRow />
      <MainGrid>
        {/*<RecentAlerts />*/}
        <AlertDetails />
        <DetectText />
        <DetectImage />
      </MainGrid>
    </div>
  )
}