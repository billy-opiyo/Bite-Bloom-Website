import Link from "next/link";
import PublicFloatingActions from "../layout/PublicFloatingActions";

export default function PublicInfoPage({ eyebrow, title, intro, children }: { eyebrow: string; title: React.ReactNode; intro: string; children: React.ReactNode }) {
  return <main className="info-page"><header className="info-header"><div className="container"><Link className="text-link" href="/">← Bite &amp; Bloom</Link><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{intro}</p></div></header><section className="container info-content">{children}</section><PublicFloatingActions message="Hi Bite & Bloom, I would love some help." /></main>;
}
