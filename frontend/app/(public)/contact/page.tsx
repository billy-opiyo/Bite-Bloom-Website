import Link from "next/link";
import PublicInfoPage from "../../../components/public/PublicInfoPage";
import { siteConfig, whatsappLink } from "../../../lib/site-config";

export default function ContactPage() {
  return <PublicInfoPage eyebrow="Say hello" title={<>Let&apos;s make it <em>sweet.</em></>} intro="Order help, custom cake ideas, delivery questions, or just a little cake chat."><div className="info-panel info-contact"><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a><a href={`tel:${siteConfig.phoneHref}`}>{siteConfig.phoneDisplay}</a><a href={whatsappLink("Hi Bite & Bloom, I have a question.")} target="_blank" rel="noreferrer">Chat on WhatsApp</a><p>{siteConfig.address}</p><Link className="button button-dark" href="/#contact">Open the contact form</Link></div></PublicInfoPage>;
}
