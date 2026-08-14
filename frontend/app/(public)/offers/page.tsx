import Link from "next/link";
import PublicInfoPage from "../../../components/public/PublicInfoPage";

export default function OffersPage() {
  return <PublicInfoPage eyebrow="Seasonal sweetness" title={<>Good things are <em>worth sharing.</em></>} intro="Browse the live catalogue for featured cakes and current availability. Promotions will appear here once configured by the bakery team."><div className="info-panel"><h2>Find your next favourite.</h2><p>Our offers are connected to the catalogue and checkout rules, so availability and pricing stay accurate.</p><Link className="button button-dark" href="/cakes">Browse featured cakes</Link></div></PublicInfoPage>;
}
