import { prisma } from "@/lib/prisma";
import AppointmentBooking from "./AppointmentBooking";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BookPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      primaryColor: true,
      logoUrl: true,
      bannerUrl: true,
      whatsapp: true,
      facebook: true,
      instagram: true,
      website: true,
    },
  });

  if (!business) return <div>Negocio no encontrado</div>;

  return (
    <div style={{ margin: "0 auto" }}>
      <AppointmentBooking  business={business}/>
    </div>
  );
}
