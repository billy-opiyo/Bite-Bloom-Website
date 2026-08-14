import LegalPage from "../../../components/legal/LegalPage";

export default function CookiesPage() {
  return <LegalPage title="Cookie Policy" intro="This draft explains how Bite & Bloom may use necessary cookies and optional measurement or preference technologies." sections={[{ title: "Necessary technologies", body: "Necessary cookies may support secure sessions, guest carts, authentication, checkout, preferences, and abuse prevention." }, { title: "Preference and measurement tools", body: "Optional tools may remember theme choices or help us understand aggregate page and ordering behavior. These tools will be enabled only with the required consent." }, { title: "Managing cookies", body: "Customers will be able to manage optional consent through the site controls and their browser settings. Blocking necessary cookies may affect cart, account, or checkout functionality." }]} />;
}
