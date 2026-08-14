import Link from "next/link";

type LegalSection = { title: string; body: string };

export default function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: LegalSection[] }) {
  return <main className="legal-page"><header className="legal-header"><div className="container"><Link className="text-link" href="/">← Bite &amp; Bloom</Link><p className="eyebrow">Important information</p><h1>{title}</h1><p>{intro}</p><span className="legal-draft">Draft · pending business and legal review</span></div></header><article className="container legal-content">{sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}<p className="legal-contact">Questions? <Link href="/#contact">Contact Bite &amp; Bloom</Link>.</p></article></main>;
}
