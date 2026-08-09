import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed demo landlord accounts first — the 3 hardcoded listings below reference
  // their real user IDs, so this must run before the listings upsert.
  const landlordPassword = await bcryptjs.hash("landlord123", 10);
  const rezaul = await prisma.user.upsert({
    where: { email: "landlord@baskhuji.local" },
    update: { name: "Rezaul Karim" },
    create: {
      email: "landlord@baskhuji.local",
      name: "Rezaul Karim",
      passwordHash: landlordPassword,
      role: "LANDLORD",
      profile: {
        create: { displayName: "Rezaul Karim", accountType: "landlord" },
      },
    },
    include: { profile: true },
  });
  console.log("✓ Demo landlord: landlord@baskhuji.local / landlord123");

  // Seed second landlord
  const shirin = await prisma.user.upsert({
    where: { email: "shirin@baskhuji.local" },
    update: {},
    create: {
      email: "shirin@baskhuji.local",
      name: "Shirin Akter",
      passwordHash: landlordPassword,
      role: "LANDLORD",
      profile: {
        create: { displayName: "Shirin Akter", accountType: "landlord" },
      },
    },
    include: { profile: true },
  });
  console.log("✓ Demo landlord: shirin@baskhuji.local / landlord123");

  // Seed third landlord
  const anwar = await prisma.user.upsert({
    where: { email: "anwar@baskhuji.local" },
    update: {},
    create: {
      email: "anwar@baskhuji.local",
      name: "Anwar Hossain",
      passwordHash: landlordPassword,
      role: "LANDLORD",
      profile: {
        create: { displayName: "Anwar Hossain", accountType: "landlord" },
      },
    },
    include: { profile: true },
  });
  console.log("✓ Demo landlord: anwar@baskhuji.local / landlord123");

  // Pre-verify the 3 demo landlords — they predate the verification feature,
  // so without this they'd suddenly lose the ability to post Active listings.
  for (const [landlord, nid, phone, address] of [
    [rezaul, "1988 4412 5567", "+880 1711 200 100", "House 14, Road 7, Dhanmondi, Dhaka"],
    [shirin, "1990 7723 9981", "+880 1811 300 200", "House 22, Road 3, Banani, Dhaka"],
    [anwar, "1985 3391 4420", "+880 1911 400 300", "House 9, Sector 7, Uttara, Dhaka"],
  ]) {
    await prisma.landlordVerification.upsert({
      where: { profileId: landlord.profile.id },
      update: { status: "verified", reviewedAt: new Date() },
      create: {
        profileId: landlord.profile.id,
        nidNumber: nid,
        phone,
        propertyAddress: address,
        status: "verified",
        reviewedAt: new Date(),
      },
    });
  }
  console.log("✓ Pre-verified the 3 demo landlords");

  // Seed the 3 hardcoded listings, each pointing at a real landlord's User.id —
  // previously these used placeholder "ll-1"/"ll-2"/"ll-3" strings that matched
  // no real user, so Trust Signals fell back to an unknown/unverified landlord.
  const listingsData = [
    {
      id: "bk-1041",
      title: "Sunlit single room, quiet lane off Bailey Road",
      area: "Shantinagar",
      city: "Dhaka",
      latitude: 23.7423,
      longitude: 90.4098,
      rent: 9500,
      deposit: 19000,
      roomType: "Single room",
      availableFrom: new Date("2026-09-01"),
      status: "Active",
      postedOn: new Date("2026-07-18"),
      landlordId: rezaul.id,
      sqft: 180,
    },
    {
      id: "bk-1042",
      title: "Two-seat mess room with balcony, student block",
      area: "Mohammadpur",
      city: "Dhaka",
      latitude: 23.7639,
      longitude: 90.3589,
      rent: 6200,
      deposit: 6200,
      roomType: "Shared mess",
      availableFrom: new Date("2026-08-15"),
      status: "Active",
      postedOn: new Date("2026-07-22"),
      landlordId: shirin.id,
      sqft: 220,
    },
    {
      id: "bk-1043",
      title: "Compact studio with kitchenette, rooftop access",
      area: "Uttara Sector 7",
      city: "Dhaka",
      latitude: 23.8687,
      longitude: 90.3987,
      rent: 14000,
      deposit: 28000,
      roomType: "Studio",
      availableFrom: new Date("2026-08-01"),
      status: "Active",
      postedOn: new Date("2026-07-05"),
      landlordId: anwar.id,
      sqft: 340,
    },
  ];

  for (const l of listingsData) {
    await prisma.listing.upsert({
      where: { id: l.id },
      update: { sqft: l.sqft, landlordId: l.landlordId },
      create: l,
    });
    console.log("✓ Listing upserted:", l.id);
  }

  // Seed demo tenant accounts — 3 of them, so roommate matching has real candidates
  // to compute against instead of showing an empty "be the first" state.
  const tenantPassword = await bcryptjs.hash("tenant123", 10);
  const demoTenants = [
    { email: "tenant@baskhuji.local", name: "Tanzila Rahman" },
    { email: "tenant2@baskhuji.local", name: "Farhan Kabir" },
    { email: "tenant3@baskhuji.local", name: "Nusrat Jahan" },
  ];
  const tenantProfiles = {};
  for (const t of demoTenants) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: { name: t.name },
      create: {
        email: t.email,
        name: t.name,
        passwordHash: tenantPassword,
        role: "TENANT",
        profile: {
          create: { displayName: t.name, accountType: "tenant" },
        },
      },
      include: { profile: true },
    });
    tenantProfiles[t.email] = user.profile.id;
    console.log(`✓ Demo tenant: ${t.email} / tenant123`);
  }

  // Give each demo tenant a genuinely different lifestyle preference, so the
  // roommate matcher has real, varied candidates to score against.
  const roommatePreferences = [
    {
      email: "tenant@baskhuji.local",
      budget: 9500,
      sleep: "Early",
      smoking: "No",
      smokingNonNegotiable: true,
      cooking: "Occasionally",
      study: "Quiet",
      visitors: "Rare",
    },
    {
      email: "tenant2@baskhuji.local",
      budget: 10500,
      sleep: "Late",
      smoking: "Tolerant",
      smokingNonNegotiable: false,
      cooking: "Daily",
      study: "Social",
      visitors: "Frequent",
    },
    {
      email: "tenant3@baskhuji.local",
      budget: 8800,
      sleep: "Flexible",
      smoking: "No",
      smokingNonNegotiable: false,
      cooking: "Rarely",
      study: "Mixed",
      visitors: "Occasional",
    },
  ];
  for (const p of roommatePreferences) {
    const profileId = tenantProfiles[p.email];
    const fields = {
      budget: p.budget,
      sleep: p.sleep,
      smoking: p.smoking,
      smokingNonNegotiable: p.smokingNonNegotiable,
      cooking: p.cooking,
      study: p.study,
      visitors: p.visitors,
    };
    await prisma.roommatePreference.upsert({
      where: { profileId },
      update: fields,
      create: { profileId, ...fields },
    });
  }
  console.log("✓ Seeded roommate preferences for all 3 demo tenants");

  // Real demo activity across listings, so logging into any of the 3 demo
  // landlord accounts (or the demo tenant) shows working features immediately —
  // ranked applicants, roommate compatibility on a shared listing, a saved
  // listing, and a verification queue for admin — instead of empty states.
  // This is scoped to the demo accounts only; a genuinely new signup still
  // starts empty, since faking data into a real new user's own account would
  // undercut the trust-signal work done elsewhere in this app.
  const tanzila = tenantProfiles["tenant@baskhuji.local"];
  const farhan = tenantProfiles["tenant2@baskhuji.local"];
  const nusrat = tenantProfiles["tenant3@baskhuji.local"];

  const demoApplications = [
    // Tanzila's application on Rezaul's single room is accepted, so the
    // agreement flow (draft → sign → PDF) is demoable end to end.
    { profileId: tanzila, listingId: "bk-1041", status: "accepted" },
    // All 3 tenants apply to Shirin's shared mess room — same listing, so
    // their roommate preferences produce real compatibility pairs on her
    // landlord desk.
    { profileId: tanzila, listingId: "bk-1042", status: "submitted" },
    { profileId: farhan, listingId: "bk-1042", status: "submitted" },
    { profileId: nusrat, listingId: "bk-1042", status: "submitted" },
    // A shortlisted applicant on Anwar's studio, for ranking/status variety.
    { profileId: farhan, listingId: "bk-1043", status: "shortlisted" },
  ];
  for (const a of demoApplications) {
    await prisma.application.upsert({
      where: { profileId_listingId: { profileId: a.profileId, listingId: a.listingId } },
      update: { status: a.status },
      create: { profileId: a.profileId, listingId: a.listingId, status: a.status },
    });
  }
  console.log("✓ Seeded demo applications (ranked applicants + a shared-listing roommate group)");

  await prisma.savedListing.upsert({
    where: { profileId_listingId: { profileId: nusrat, listingId: "bk-1043" } },
    update: {},
    create: { profileId: nusrat, listingId: "bk-1043" },
  });
  console.log("✓ Seeded a demo saved listing");

  // Tanzila is a verified tenant (shows the trust badge + ranks first);
  // Farhan has a pending submission so admin's queue isn't empty on login.
  await prisma.tenantVerification.upsert({
    where: { profileId: tanzila },
    update: { status: "verified", reviewedAt: new Date() },
    create: {
      profileId: tanzila,
      nidNumber: "1994 7712 8830",
      phone: "+880 1712 445 908",
      status: "verified",
      reviewedAt: new Date(),
    },
  });
  await prisma.tenantVerification.upsert({
    where: { profileId: farhan },
    update: {},
    create: {
      profileId: farhan,
      nidNumber: "1996 3321 7710",
      phone: "+880 1812 990 213",
      status: "pending",
    },
  });
  console.log("✓ Seeded demo tenant verifications (one verified, one pending for admin review)");

  // A pre-drafted agreement for Tanzila's accepted application, so the agreement
  // page and her profile both show a real entry without waiting on a live Gemini
  // call first. Signatures are left blank on purpose — signing live (draw or
  // type) is itself a feature worth demoing, not something to fake in advance.
  const agreementReference = "bk-1041/12M";
  await prisma.agreementDraft.upsert({
    where: { profileId_reference: { profileId: tanzila, reference: agreementReference } },
    update: {},
    create: {
      profileId: tanzila,
      reference: agreementReference,
      source: "fallback",
      termsJson: {
        reference: agreementReference,
        landlordName: "Rezaul Karim",
        landlordVerifiedSince: "verified",
        tenantName: "Tanzila Rahman",
        tenantNid: "1994 7712 8830",
        tenantPhone: "+880 1712 445 908",
        propertyTitle: "Sunlit single room, quiet lane off Bailey Road",
        roomType: "Single room",
        area: "Shantinagar",
        city: "Dhaka",
        coords: "23.7423, 90.4098",
        rent: 9500,
        deposit: 19000,
        durationMonths: 12,
        startDate: "1 Sep 2026",
        endDate: "1 Sep 2027",
        houseRules: [],
      },
      clausesJson: [
        {
          title: "Parties",
          body: 'This agreement is made between Rezaul Karim (the "Landlord"), a BasaKhuji-verified property owner, and Tanzila Rahman (the "Tenant"), holder of National ID 1994 7712 8830, contactable on +880 1712 445 908.',
        },
        {
          title: "Premises",
          body: 'The Landlord lets the single room described as "Sunlit single room, quiet lane off Bailey Road" at Shantinagar, Dhaka.',
        },
        {
          title: "Term",
          body: "The tenancy runs 12 months from 1 Sep 2026 to 1 Sep 2027, renewable by mutual written acknowledgement on the platform.",
        },
        {
          title: "Rent and deposit",
          body: "Rent is BDT 9,500 per month, payable by the 5th and logged on BasaKhuji. A refundable security deposit of BDT 19,000 is held and returned at final settlement, less documented deductions.",
        },
        {
          title: "Record of tenancy",
          body: "Every payment, maintenance request and message exchanged on the platform forms part of the tenancy record and may be relied on by either party in a dispute.",
        },
      ],
    },
  });
  console.log("✓ Seeded a demo agreement draft (unsigned — sign it live to demo the feature)");

  // Seed admin account
  const adminPassword = await bcryptjs.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@baskhuji.local" },
    update: { name: "Platform Admin" },
    create: {
      email: "admin@baskhuji.local",
      name: "Platform Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
      profile: {
        create: { displayName: "Platform Admin", accountType: "tenant" },
      },
    },
  });
  console.log("✓ Demo admin: admin@baskhuji.local / admin123");

  console.log("\n✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
