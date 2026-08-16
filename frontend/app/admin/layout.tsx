import type { Metadata } from "next";
import AdminUtilityLinks from "../../components/admin/AdminUtilityLinks";

export const metadata: Metadata = {
  title: "Bite & Bloom Studio",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><div className="admin-utility-shell"><AdminUtilityLinks /></div>{children}</>;
}
