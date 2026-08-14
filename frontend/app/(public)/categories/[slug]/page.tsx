import { redirect } from "next/navigation";

export default function CategoryPage({ params }: { params: { slug: string } }) {
  redirect(`/cakes?category=${encodeURIComponent(params.slug)}`);
}
