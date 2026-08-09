import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getLandlordSummary } from "@/lib/landlord-summary.server";
import { ListingDetail } from "./listing-detail";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) notFound();

  const owner = await getLandlordSummary(listing.landlordId);

  return (
    <ListingDetail
      listing={{
        id: listing.id,
        title: listing.title,
        description: listing.description,
        area: listing.area,
        city: listing.city,
        latitude: listing.latitude,
        longitude: listing.longitude,
        rent: listing.rent,
        deposit: listing.deposit,
        roomType: listing.roomType,
        availableFrom: listing.availableFrom.toISOString(),
        postedOn: listing.postedOn.toISOString(),
        landlordId: listing.landlordId,
        houseRules: listing.houseRules,
        photoUrls: listing.photoUrls,
        sqft: listing.sqft,
      }}
      owner={owner}
    />
  );
}
