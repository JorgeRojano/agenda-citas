import ReportsClient from "./ReportsClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ReportsPage({ params }: Props) {
  const { slug } = await params;
  return <ReportsClient slug={slug} />;
}
