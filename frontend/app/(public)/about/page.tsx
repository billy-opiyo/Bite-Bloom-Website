import Link from "next/link";
import PublicInfoPage from "../../../components/public/PublicInfoPage";

export default function AboutPage() {
  return <PublicInfoPage eyebrow="The story behind the slices" title={<>Made with care, <em>for your moments.</em></>} intro="Bite & Bloom creates thoughtful cakes for birthdays, weddings, milestones, and all the ordinary days worth celebrating."><div className="info-panel"><h2>A little more joy, one slice at a time.</h2><p>We bake in small batches, listen closely to what each celebration needs, and finish every order with care. Our menu is designed to be easy to browse while leaving room for your own story.</p><Link className="button button-dark" href="/cakes">Explore the cakes</Link></div></PublicInfoPage>;
}
