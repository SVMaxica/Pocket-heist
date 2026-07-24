import HeistCardGrid from "@/components/HeistCardGrid";
import HeistCardList from "@/components/HeistCardList";

export default function HeistsPage() {
  return (
    <div className="page-content">
      <div className="active-heists">
        <h2>Your Active Heists</h2>
        <HeistCardGrid mode="active" />
      </div>
      <div className="assigned-heists">
        <h2>Heists You&apos;ve Assigned</h2>
        <HeistCardGrid mode="assigned" />
      </div>
      <div className="expired-heists">
        <h2>All Expired Heists</h2>
        <HeistCardList />
      </div>
    </div>
  );
}
