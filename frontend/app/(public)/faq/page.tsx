import Link from "next/link";
import PublicInfoPage from "../../../components/public/PublicInfoPage";

const questions = [["How far ahead should I order?", "Custom designs are best ordered 3–5 days ahead. Availability and preparation time are confirmed on each cake."], ["Do you offer delivery and pickup?", "Yes. Checkout supports home delivery across configured Nairobi areas and pickup from the studio."], ["Can I request a custom design?", "Yes. Add your inspiration and message details where supported, or contact the team for a quotation."], ["How can I get help with an order?", "Use WhatsApp, phone, email, or the contact form and include your order number when available."]];

export default function FaqPage() {
  return <PublicInfoPage eyebrow="Good things to know" title={<>Questions, <em>answered.</em></>} intro="A quick guide before you choose something lovely."><div className="info-faq">{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div><Link className="button button-outline" href="/#contact">Ask another question</Link></PublicInfoPage>;
}
