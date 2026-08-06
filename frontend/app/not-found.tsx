import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-screen">
      <span className="loading-mark">✦</span>
      <p className="eyebrow">A little detour</p>
      <h1>That page hasn&apos;t been baked yet.</h1>
      <Link className="button button-dark" href="/">Back to the cake counter</Link>
    </main>
  );
}
