import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: "Corporate Events", slug: "corporate", description: "Events at IT parks and corporate offices", icon: "Briefcase", sortOrder: 1 } }),
    prisma.category.create({ data: { name: "Gated Community", slug: "gated-community", description: "Weekend events at residential communities", icon: "Building2", sortOrder: 2 } }),
    prisma.category.create({ data: { name: "Wedding Exhibition", slug: "wedding", description: "Wedding and bridal exhibitions", icon: "PartyPopper", sortOrder: 3 } }),
    prisma.category.create({ data: { name: "Food Festival", slug: "food-festival", description: "Food carnivals and street food events", icon: "UtensilsCrossed", sortOrder: 4 } }),
    prisma.category.create({ data: { name: "Trade Fair", slug: "trade-fair", description: "B2B and B2C trade exhibitions", icon: "Star", sortOrder: 5 } }),
    prisma.category.create({ data: { name: "Weekend Market", slug: "weekend-market", description: "Regular weekend flea markets", icon: "ShoppingBag", sortOrder: 6 } }),
  ]);

  console.log(`Created ${categories.length} categories`);

  // Create users
  const hashedPassword = await bcrypt.hash("password123", 12);

  const vendor = await prisma.user.create({
    data: {
      name: "Ravi Kumar",
      email: "vendor@stallmate.in",
      password: hashedPassword,
      phone: "+91 9876543210",
      role: "VENDOR",
      company: "Ravi's Fashion House",
      isVerified: true,
      vendorProfile: {
        create: {
          businessName: "Ravi's Fashion House",
          category: "Clothing & Fashion",
          description: "Premium ethnic and western wear for all occasions. We bring the latest Hyderabad fashion to your community events.",
          experience: 5,
          rating: 4.5,
          totalEvents: 23,
          isTrusted: true,
          stallPhotos: JSON.stringify([
            "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400",
            "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400",
            "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400",
          ]),
        },
      },
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "manager@stallmate.in",
      password: hashedPassword,
      phone: "+91 9876543211",
      role: "EVENT_MANAGER",
      company: "EventPro Solutions",
      isVerified: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Suresh Reddy",
      email: "admin@stallmate.in",
      password: hashedPassword,
      phone: "+91 9876543212",
      role: "VENUE_ADMIN",
      company: "Aparna Constructions",
      isVerified: true,
    },
  });

  // Extra event managers so "Most Repeated Companies" on the venue dashboard has real ranked data.
  const manager2 = await prisma.user.create({
    data: {
      name: "Kavya Iyer",
      email: "mriga@stallmate.in",
      password: hashedPassword,
      phone: "+91 9876543217",
      role: "EVENT_MANAGER",
      company: "Mriga Events",
      isVerified: true,
    },
  });

  const manager3 = await prisma.user.create({
    data: {
      name: "Rahul Mehta",
      email: "vismaya@stallmate.in",
      password: hashedPassword,
      phone: "+91 9876543218",
      role: "EVENT_MANAGER",
      company: "Vismaya Events",
      isVerified: true,
    },
  });

  const manager4 = await prisma.user.create({
    data: {
      name: "Anjali Rao",
      email: "celebration@stallmate.in",
      password: hashedPassword,
      phone: "+91 9876543219",
      role: "EVENT_MANAGER",
      company: "Celebration Makers",
      isVerified: true,
    },
  });

  // Additional vendors for the directory
  const vendor2 = await prisma.user.create({
    data: {
      name: "Fatima Begum",
      email: "fatima@stallmate.in",
      password: hashedPassword,
      phone: "+91 9876543213",
      role: "VENDOR",
      company: "Fatima's Biryani & More",
      isVerified: true,
      vendorProfile: {
        create: {
          businessName: "Fatima's Biryani & More",
          category: "Food & Beverages",
          description: "Authentic Hyderabadi biryani and street food. Serving communities across Gachibowli, Kondapur, and Madhapur for 8 years.",
          experience: 8,
          rating: 4.8,
          totalEvents: 45,
          isTrusted: true,
          fssaiNumber: "10024051000123",
          fssaiVerified: true,
          stallPhotos: JSON.stringify([
            "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400",
            "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
          ]),
        },
      },
    },
  });

  const vendor3 = await prisma.user.create({
    data: {
      name: "Lakshmi Devi",
      email: "lakshmi@stallmate.in",
      password: hashedPassword,
      phone: "+91 9876543214",
      role: "VENDOR",
      company: "Lakshmi Handicrafts",
      isVerified: true,
      vendorProfile: {
        create: {
          businessName: "Lakshmi Handicrafts",
          category: "Handicrafts",
          description: "Handmade Pochampally ikat, Nirmal paintings, and Bidri craft. Supporting local artisans from Telangana.",
          experience: 12,
          rating: 4.3,
          totalEvents: 18,
          isTrusted: true,
          stallPhotos: JSON.stringify([
            "https://images.unsplash.com/photo-1528396518501-b53b6eb67d47?w=400",
          ]),
        },
      },
    },
  });

  const vendor4 = await prisma.user.create({
    data: {
      name: "Arjun Reddy",
      email: "arjun@stallmate.in",
      password: hashedPassword,
      phone: "+91 9876543215",
      role: "VENDOR",
      company: "Green Thumb Plants",
      isVerified: true,
      vendorProfile: {
        create: {
          businessName: "Green Thumb Plants",
          category: "Plants & Garden",
          description: "Indoor plants, succulents, and garden accessories. Perfect for apartment living!",
          experience: 3,
          rating: 4.6,
          totalEvents: 12,
          isTrusted: true,
          stallPhotos: JSON.stringify([
            "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
            "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400",
          ]),
        },
      },
    },
  });

  const vendor5 = await prisma.user.create({
    data: {
      name: "Meena Kumari",
      email: "meena@stallmate.in",
      password: hashedPassword,
      phone: "+91 9876543216",
      role: "VENDOR",
      company: "Meena's Jewel Box",
      isVerified: true,
      vendorProfile: {
        create: {
          businessName: "Meena's Jewel Box",
          category: "Jewellery & Accessories",
          description: "Oxidized silver, temple jewellery, and trendy accessories. Budget-friendly options for every occasion.",
          experience: 6,
          rating: 4.1,
          totalEvents: 8,
        },
      },
    },
  });

  console.log("Created 6 users (5 vendors, 1 manager, 1 admin)");

  // Create venues
  const venue1 = await prisma.venue.create({
    data: {
      name: "Aparna Sarovar Grande",
      slug: "aparna-sarovar-grande",
      type: "GATED_COMMUNITY",
      address: "Nallagandla, Serilingampally",
      city: "Hyderabad",
      area: "Nallagandla",
      state: "Telangana",
      pincode: "500019",
      latitude: 17.4486,
      longitude: 78.3313,
      description: "Premium gated community with 2000+ families. Large clubhouse area and open grounds perfect for weekend bazaars and community events.",
      capacity: 5000,
      totalStallSlots: 50,
      familyCount: 2000,
      vendorRating: 4.3,
      eventFrequency: "Monthly — usually last weekend",
      bestCategories: JSON.stringify(["Food & Beverages", "Clothing & Fashion", "Home Decor", "Plants & Garden"]),
      powerSupply: "Reliable — 15A socket per stall",
      parkingNotes: "Visitor parking near Gate 2, two-wheelers near clubhouse",
      smartScore: 82,
      avgSpendPerVisit: 450,
      contactName: "Suresh Reddy",
      contactPhone: "+91 9876543212",
      contactEmail: "admin@stallmate.in",
      adminId: admin.id,
      amenities: {
        create: [
          { name: "Power Supply", description: "15A power socket per stall", isAvailable: true, charges: 200 },
          { name: "Wi-Fi", description: "Free Wi-Fi for vendors", isAvailable: true, charges: 0 },
          { name: "Security", description: "24/7 security with CCTV", isAvailable: true, charges: 0 },
          { name: "Restrooms", description: "Clean restrooms near stall area", isAvailable: true, charges: 0 },
          { name: "Water Supply", description: "Drinking water facility", isAvailable: true, charges: 0 },
          { name: "Tables & Chairs", description: "1 table + 2 chairs per stall", isAvailable: true, charges: 300 },
        ],
      },
      parkingSlots: {
        create: [
          { slotNumber: "P1", type: "TWO_WHEELER", charges: 0 },
          { slotNumber: "P2", type: "TWO_WHEELER", charges: 0 },
          { slotNumber: "P3", type: "TWO_WHEELER", charges: 0 },
          { slotNumber: "P4", type: "FOUR_WHEELER", charges: 100 },
          { slotNumber: "P5", type: "FOUR_WHEELER", charges: 100 },
          { slotNumber: "P6", type: "VAN", charges: 200 },
        ],
      },
    },
  });

  const venue2 = await prisma.venue.create({
    data: {
      name: "DLF Cyber City",
      slug: "dlf-cyber-city-gachibowli",
      type: "CORPORATE_OFFICE",
      address: "Gachibowli, Nanakramguda",
      city: "Hyderabad",
      area: "Gachibowli",
      state: "Telangana",
      pincode: "500032",
      latitude: 17.4239,
      longitude: 78.3427,
      description: "Major IT hub with 50,000+ employees. Food court area and open atrium available for vendor exhibitions.",
      capacity: 10000,
      totalStallSlots: 80,
      employeeCount: 50000,
      vendorRating: 4.5,
      eventFrequency: "Quarterly — Diwali, Holi, Christmas, and Independence Day",
      bestCategories: JSON.stringify(["Food & Beverages", "Electronics", "Clothing & Fashion", "Health & Wellness"]),
      powerSupply: "Industrial grade — very reliable",
      parkingNotes: "B1 basement allocated for vendors, collect pass at Gate 3",
      smartScore: 91,
      avgSpendPerVisit: 800,
      contactName: "DLF Management",
      contactPhone: "+91 9876543220",
      adminId: admin.id,
      amenities: {
        create: [
          { name: "Power Supply", description: "Industrial grade power supply", isAvailable: true, charges: 500 },
          { name: "Wi-Fi", description: "High-speed corporate Wi-Fi", isAvailable: true, charges: 0 },
          { name: "Security", description: "Corporate-grade security", isAvailable: true, charges: 0 },
          { name: "Air Conditioning", description: "Central AC in indoor areas", isAvailable: true, charges: 0 },
          { name: "Elevator Access", description: "Freight elevator for setup", isAvailable: true, charges: 0 },
        ],
      },
      parkingSlots: {
        create: [
          { slotNumber: "B1-01", type: "FOUR_WHEELER", charges: 200 },
          { slotNumber: "B1-02", type: "FOUR_WHEELER", charges: 200 },
          { slotNumber: "B1-03", type: "VAN", charges: 300 },
          { slotNumber: "B1-04", type: "TRUCK", charges: 500 },
        ],
      },
    },
  });

  const venue3 = await prisma.venue.create({
    data: {
      name: "HICC Convention Center",
      slug: "hicc-convention-center",
      type: "CONVENTION_CENTER",
      address: "Madhapur, HITEC City",
      city: "Hyderabad",
      area: "Madhapur",
      state: "Telangana",
      pincode: "500081",
      description: "Hyderabad International Convention Centre - premier venue for large-scale exhibitions and wedding fairs.",
      capacity: 20000,
      totalStallSlots: 150,
      vendorRating: 4.1,
      eventFrequency: "Weekly — multiple events per month",
      bestCategories: JSON.stringify(["Jewellery & Accessories", "Clothing & Fashion", "Handicrafts"]),
      powerSupply: "Premium — charges apply",
      smartScore: 75,
      avgSpendPerVisit: 1200,
      contactName: "HICC Events Team",
      contactPhone: "+91 9876543230",
      adminId: admin.id,
      amenities: {
        create: [
          { name: "Power Supply", isAvailable: true, charges: 1000 },
          { name: "Wi-Fi", isAvailable: true, charges: 500 },
          { name: "Security", isAvailable: true, charges: 0 },
          { name: "Air Conditioning", isAvailable: true, charges: 0 },
          { name: "Loading Dock", description: "For heavy equipment", isAvailable: true, charges: 0 },
        ],
      },
    },
  });

  console.log("Created 3 venues");

  // Create events
  const event1 = await prisma.event.create({
    data: {
      title: "Weekend Bazaar at Aparna Sarovar",
      slug: "weekend-bazaar-aparna-sarovar-mar2026",
      description: "Join us for an exciting weekend bazaar at Aparna Sarovar Grande! Perfect for clothing, handicrafts, home decor, and food vendors. Over 2000 families as potential customers.",
      shortDescription: "Weekend market with 2000+ families as audience",
      categoryId: categories[1].id,
      venueId: venue1.id,
      organizerId: manager.id,
      startDate: new Date("2026-03-29"),
      endDate: new Date("2026-03-30"),
      startTime: "10:00",
      endTime: "20:00",
      eventType: "WEEKEND_COMMUNITY",
      status: "PUBLISHED",
      maxStalls: 40,
      bookedStalls: 0,
      basePrice: 3500,
      bookingDeadline: new Date("2026-03-27"),
      cancellationPolicy: "Full refund if cancelled 7 days before. 50% refund within 3-7 days. No refund within 3 days.",
      parkingInfo: "Parking is available at the community visitor parking area near Gate 2. Two-wheelers can park near the clubhouse.",
      stallCategories: JSON.stringify(["Womens Wear", "Mens Wear", "Kids & Toys", "Food & Beverages", "Home Decor", "Handicrafts", "Jewellery", "Electronics"]),
      isFeatured: true,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      title: "Corporate Expo at DLF Cyber City",
      slug: "corporate-expo-dlf-apr2026",
      description: "3-day corporate exhibition at DLF Cyber City targeting 50,000+ IT professionals. Ideal for tech gadgets, lifestyle brands, food vendors, and service providers.",
      shortDescription: "3-day expo at Hyderabad's biggest IT hub",
      categoryId: categories[0].id,
      venueId: venue2.id,
      organizerId: manager.id,
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-04-03"),
      startTime: "09:00",
      endTime: "18:00",
      eventType: "WEEKDAY_CORPORATE",
      status: "PUBLISHED",
      maxStalls: 60,
      bookedStalls: 0,
      basePrice: 8000,
      bookingDeadline: new Date("2026-03-28"),
      cancellationPolicy: "Full refund if cancelled 10 days before. 50% refund within 5-10 days. No refund within 5 days.",
      parkingInfo: "Vendor parking allocated in B1 basement parking. Please collect your parking pass from security at Gate 3.",
      stallCategories: JSON.stringify(["Electronics", "Gadgets", "Fashion", "Food & Beverages", "Health & Wellness", "Finance & Insurance", "Education", "Lifestyle"]),
      isFeatured: true,
    },
  });

  const event3 = await prisma.event.create({
    data: {
      title: "Grand Wedding Fair at HICC",
      slug: "wedding-fair-hicc-apr2026",
      description: "The biggest wedding exhibition in Hyderabad! Showcase your wedding services - from jewellery and clothing to catering and decor. 10,000+ visitors expected.",
      shortDescription: "Hyderabad's biggest wedding exhibition",
      categoryId: categories[2].id,
      venueId: venue3.id,
      organizerId: manager.id,
      startDate: new Date("2026-04-05"),
      endDate: new Date("2026-04-06"),
      startTime: "10:00",
      endTime: "21:00",
      eventType: "WEDDING",
      status: "PUBLISHED",
      maxStalls: 80,
      bookedStalls: 0,
      basePrice: 12000,
      bookingDeadline: new Date("2026-04-02"),
      parkingInfo: "Ample parking available at HICC multi-level parking. Vendor vehicles with heavy equipment can use the loading dock entrance.",
      stallCategories: JSON.stringify(["Jewellery", "Bridal Wear", "Mens Wedding Wear", "Catering", "Decor & Flowers", "Photography", "Invitations", "Mehendi & Makeup"]),
      isFeatured: true,
    },
  });

  const event4 = await prisma.event.create({
    data: {
      title: "Sunday Food Carnival - My Home Bhooja",
      slug: "food-carnival-bhooja-mar2026",
      description: "Delicious food carnival at My Home Bhooja community! Open to all food vendors - street food, beverages, desserts, and more.",
      shortDescription: "Sunday food fest with 1500+ families",
      categoryId: categories[3].id,
      venueId: venue1.id,
      organizerId: manager.id,
      startDate: new Date("2026-03-30"),
      endDate: new Date("2026-03-30"),
      startTime: "11:00",
      endTime: "22:00",
      eventType: "WEEKEND_COMMUNITY",
      status: "PUBLISHED",
      maxStalls: 25,
      bookedStalls: 0,
      basePrice: 2500,
      parkingInfo: "Limited parking near the community gate. Please use two-wheelers if possible.",
      stallCategories: JSON.stringify(["Street Food", "Beverages", "Desserts", "Biryani", "Chinese", "Chat & Snacks"]),
      isFeatured: false,
    },
  });

  console.log("Created 4 events");

  // Create stalls for event1
  const event1Categories = ["Womens Wear", "Mens Wear", "Kids & Toys", "Food & Beverages", "Home Decor", "Handicrafts", "Jewellery", "Electronics"];
  const stallsData = [];
  const cols = 8;
  for (let i = 0; i < 40; i++) {
    const isCorner = i === 0 || i === cols - 1 || i === 32 || i === 39;
    const isPremium = i < cols;
    stallsData.push({
      eventId: event1.id,
      stallNumber: `${i + 1}`,
      type: isCorner ? "CORNER" : isPremium ? "PREMIUM" : "STANDARD",
      size: isCorner ? "10x10" : isPremium ? "8x8" : "6x6",
      price: isCorner ? 6000 : isPremium ? 5000 : 3500,
      stallCategory: event1Categories[i % event1Categories.length],
      positionX: i % cols,
      positionY: Math.floor(i / cols),
      width: 1,
      height: 1,
      status: "AVAILABLE",
    });
  }

  await prisma.stall.createMany({ data: stallsData });

  // Create stalls for event2
  const event2Categories = ["Tech & Gadgets", "Home Appliances", "Fashion", "Food Court", "Furniture", "Health & Wellness"];
  const stalls2 = [];
  for (let i = 0; i < 60; i++) {
    stalls2.push({
      eventId: event2.id,
      stallNumber: `${i + 1}`,
      type: i < 10 ? "PREMIUM" : i >= 50 ? "FOOD_COURT" : "STANDARD",
      size: i < 10 ? "10x10" : "8x8",
      price: i < 10 ? 15000 : i >= 50 ? 10000 : 8000,
      stallCategory: event2Categories[i % event2Categories.length],
      positionX: i % 10,
      positionY: Math.floor(i / 10),
      width: 1,
      height: 1,
      status: "AVAILABLE",
    });
  }

  await prisma.stall.createMany({ data: stalls2 });

  // Create stalls for event3
  const event3Categories = ["Bridal Wear", "Jewellery", "Mehendi & Beauty", "Catering", "Decor & Flowers", "Photography", "Gifts & Trousseau", "Invitations"];
  const stalls3 = [];
  for (let i = 0; i < 80; i++) {
    stalls3.push({
      eventId: event3.id,
      stallNumber: `${i + 1}`,
      type: i < 16 ? "PREMIUM" : "STANDARD",
      size: i < 16 ? "10x15" : "8x8",
      price: i < 16 ? 20000 : 12000,
      stallCategory: event3Categories[i % event3Categories.length],
      positionX: i % 10,
      positionY: Math.floor(i / 10),
      width: 1,
      height: 1,
      status: "AVAILABLE",
    });
  }

  await prisma.stall.createMany({ data: stalls3 });

  // Create stalls for event4
  const event4Categories = ["Street Food", "Beverages", "Desserts", "Biryani", "Chinese", "Chat & Snacks"];
  const stalls4 = [];
  for (let i = 0; i < 25; i++) {
    stalls4.push({
      eventId: event4.id,
      stallNumber: `${i + 1}`,
      type: "FOOD_COURT",
      size: "6x6",
      price: 2500,
      stallCategory: event4Categories[i % event4Categories.length],
      positionX: i % 5,
      positionY: Math.floor(i / 5),
      width: 1,
      height: 1,
      status: "AVAILABLE",
    });
  }

  await prisma.stall.createMany({ data: stalls4 });

  console.log("Created stalls for all events");

  // Create a sample booking
  const stall = await prisma.stall.findFirst({ where: { eventId: event1.id, stallNumber: "1" } });
  if (stall) {
    await prisma.booking.create({
      data: {
        bookingNumber: "SM-DEMO-001",
        eventId: event1.id,
        stallId: stall.id,
        vendorId: vendor.id,
        stallCategory: stall.stallCategory,
        status: "CONFIRMED",
        amount: stall.price,
        tax: Math.round(stall.price * 0.18),
        totalAmount: Math.round(stall.price * 1.18),
        paymentStatus: "PAID",
        paidAt: new Date(),
      },
    });

    await prisma.stall.update({
      where: { id: stall.id },
      data: { status: "BOOKED" },
    });

    await prisma.event.update({
      where: { id: event1.id },
      data: { bookedStalls: 1 },
    });
  }

  console.log("Created sample booking");

  // Create a review
  await prisma.review.create({
    data: {
      eventId: event1.id,
      authorId: vendor.id,
      targetId: manager.id,
      rating: 5,
      title: "Excellent event!",
      comment: "Great footfall and well-organized event. The community was very welcoming. Will definitely book again!",
    },
  });

  console.log("Created sample review");

  // Create Setup Kits
  await prisma.setupKit.createMany({
    data: [
      {
        venueId: venue1.id,
        name: "Basic Kit",
        description: "Everything you need for a simple stall",
        items: JSON.stringify(["6x6 Canopy Tent", "1 Table", "2 Chairs", "Extension Board"]),
        price: 1200,
      },
      {
        venueId: venue1.id,
        name: "Premium Kit",
        description: "Professional setup with branding support",
        items: JSON.stringify(["8x8 Canopy Tent", "2 Tables", "4 Chairs", "LED Lights", "Banner Stand", "Extension Board"]),
        price: 2500,
      },
      {
        venueId: venue2.id,
        name: "Corporate Kit",
        description: "Professional indoor setup",
        items: JSON.stringify(["Display Table", "2 Chairs", "Tablecloth", "Banner Stand", "WiFi Access"]),
        price: 1800,
      },
    ],
  });

  console.log("Created setup kits");

  // Create Government Schemes
  await prisma.governmentScheme.createMany({
    data: [
      {
        name: "MSME Exhibition Subsidy (MDA Scheme)",
        description: "The Marketing Development Assistance scheme reimburses stall charges for MSMEs participating in exhibitions and trade fairs.",
        eligibility: JSON.stringify([
          "Must have valid Udyam Registration (free at udyamregistration.gov.in)",
          "Annual turnover below Rs 250 Crore",
          "Applicable for domestic and international exhibitions",
        ]),
        benefits: "80-100% reimbursement of stall rental charges, up to Rs 1.5 Lakh for domestic exhibitions",
        applicationUrl: "https://msme.gov.in",
        category: "MSME",
      },
      {
        name: "PM SVANidhi — Street Vendor Loan",
        description: "Micro-credit facility for street vendors to restart/expand their livelihood, including stall vendors.",
        eligibility: JSON.stringify([
          "Street vendor with valid vending certificate or Letter of Recommendation",
          "Operating in urban areas",
          "No existing loan defaults",
        ]),
        benefits: "Working capital loan of Rs 10,000 (1st), Rs 20,000 (2nd), Rs 50,000 (3rd cycle) at subsidized 7% interest",
        applicationUrl: "https://pmsvanidhi.mohua.gov.in",
        category: "SVANDHI",
      },
      {
        name: "Telangana T-PRIDE Scheme",
        description: "Telangana state scheme providing incentives for SC/ST entrepreneurs including marketing and exhibition support.",
        eligibility: JSON.stringify([
          "SC/ST entrepreneur registered in Telangana",
          "Valid MSME/Udyam registration",
          "Business operational for at least 1 year",
        ]),
        benefits: "Reimbursement of stall rental and travel costs for exhibitions, marketing subsidies up to Rs 2 Lakh",
        applicationUrl: "https://tsobmms.cgg.gov.in",
        category: "STATE",
      },
      {
        name: "Udyam Registration (Free MSME Registration)",
        description: "Free online registration that makes you eligible for multiple government schemes, subsidies, and bank loans at lower interest.",
        eligibility: JSON.stringify([
          "Any business with investment up to Rs 50 Crore",
          "Aadhaar number of the owner",
          "PAN and GST number (if applicable)",
        ]),
        benefits: "Access to all MSME schemes, priority in government procurement, lower interest on bank loans, protection against delayed payments",
        applicationUrl: "https://udyamregistration.gov.in",
        category: "CENTRAL",
      },
      {
        name: "FSSAI Basic Registration",
        description: "Mandatory registration for all food vendors. Basic registration costs only Rs 100 and is valid for 1-5 years.",
        eligibility: JSON.stringify([
          "Any food vendor with annual turnover below Rs 12 Lakh",
          "Applicable for temporary stalls and street food vendors",
          "Aadhaar and photo required",
        ]),
        benefits: "Legal compliance for selling food, builds customer trust, required by most event organizers. Only Rs 100 for basic registration.",
        applicationUrl: "https://foscos.fssai.gov.in",
        category: "CENTRAL",
      },
    ],
  });

  console.log("Created government schemes");

  // ─── REAL HYDERABAD EVENTS (from bookmystall.in) ───────────────────
  // Add more categories for real events
  const extraCategories = await Promise.all([
    prisma.category.upsert({ where: { slug: "carnival" }, update: {}, create: { name: "Carnival", slug: "carnival", description: "Community carnivals and fun events", icon: "PartyPopper", sortOrder: 7 } }),
    prisma.category.upsert({ where: { slug: "lifestyle-exhibition" }, update: {}, create: { name: "Lifestyle Exhibition", slug: "lifestyle-exhibition", description: "Lifestyle and home products exhibitions", icon: "ShoppingBag", sortOrder: 8 } }),
    prisma.category.upsert({ where: { slug: "fashion-exhibition" }, update: {}, create: { name: "Fashion Exhibition", slug: "fashion-exhibition", description: "Fashion and clothing exhibitions", icon: "Star", sortOrder: 9 } }),
    prisma.category.upsert({ where: { slug: "women-expo" }, update: {}, create: { name: "Women Expo", slug: "women-expo", description: "Women-focused exhibitions and expos", icon: "Users", sortOrder: 10 } }),
    prisma.category.upsert({ where: { slug: "brand-expo" }, update: {}, create: { name: "Brand Expo", slug: "brand-expo", description: "Brand showcase and expo events", icon: "Star", sortOrder: 11 } }),
    prisma.category.upsert({ where: { slug: "flea-market" }, update: {}, create: { name: "Flea Market", slug: "flea-market", description: "Flea markets and bazaars", icon: "ShoppingBag", sortOrder: 12 } }),
    prisma.category.upsert({ where: { slug: "mega-mela" }, update: {}, create: { name: "Mega Mela", slug: "mega-mela", description: "Large-scale community melas", icon: "PartyPopper", sortOrder: 13 } }),
    prisma.category.upsert({ where: { slug: "pop-up-market" }, update: {}, create: { name: "Pop-up Market", slug: "pop-up-market", description: "Trendy pop-up shopping experiences", icon: "ShoppingBag", sortOrder: 14 } }),
  ]);

  const catMap: Record<string, string> = {};
  for (const c of [...categories, ...extraCategories]) {
    catMap[c.slug] = c.id;
  }

  // Helper to create venue
  async function getOrCreateVenue(name: string, area: string, type: string, opts: { familyCount?: number; employeeCount?: number } = {}) {
    const slug = name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "") + "-" + area.toLowerCase().replace(/\s+/g, "-");
    const existing = await prisma.venue.findUnique({ where: { slug } });
    if (existing) return existing.id;
    const v = await prisma.venue.create({
      data: {
        name, slug, type,
        address: `${area}, Hyderabad`,
        city: "Hyderabad", area, state: "Telangana", pincode: "500000",
        familyCount: opts.familyCount || 0,
        employeeCount: opts.employeeCount || 0,
        adminId: admin.id,
        totalStallSlots: Math.floor(Math.random() * 30) + 15,
      },
    });
    return v.id;
  }

  // Real events data from bookmystall.in Hyderabad (April-May 2026)
  const realEvents = [
    { title: "Srk Events Carnival", date: "2026-04-03", venue: "Vishnu Krupas Golden Oriole", area: "Bachupally", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 25, price: 3000, fc: 300 },
    { title: "Lifestyle Exhibition - Avalon", date: "2026-04-03", venue: "Avalon Apartments", area: "Gudimalkapur", vType: "GATED_COMMUNITY", cat: "lifestyle-exhibition", eType: "WEEKEND_COMMUNITY", stalls: 20, price: 2500, fc: 200 },
    { title: "Tirumala Events Carnival", date: "2026-04-03", venue: "Fort View Apartments", area: "Bandlaguda", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 30, price: 2000, fc: 250 },
    { title: "The Women Expo Summer Carnival", date: "2026-04-04", venue: "Ved Vihar Badminton Court", area: "Kukatpally", vType: "GATED_COMMUNITY", cat: "women-expo", eType: "WEEKEND_COMMUNITY", stalls: 40, price: 3500, fc: 400 },
    { title: "Jabilly Events - Fashion Lifestyle Exhibition", date: "2026-04-04", endDate: "2026-04-05", venue: "Hyndava Gaurik Convention", area: "Kompally", vType: "CONVENTION_CENTER", cat: "fashion-exhibition", eType: "EXHIBITION", stalls: 60, price: 5000 },
    { title: "Leo Lifestyle Exhibition", date: "2026-04-04", endDate: "2026-04-05", venue: "I Convention", area: "Ameenpur", vType: "CONVENTION_CENTER", cat: "lifestyle-exhibition", eType: "EXHIBITION", stalls: 80, price: 6000 },
    { title: "Pavithra Associates Summer Carnival", date: "2026-04-04", venue: "TNR Sulakshana", area: "LB Nagar", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 25, price: 2500, fc: 350 },
    { title: "Vismaya Events - Summer Special Carnival", date: "2026-04-04", venue: "Kantivanam Colony Park", area: "Kondapur", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 30, price: 3000, fc: 500 },
    { title: "Celestia Events Summer Carnival", date: "2026-04-04", venue: "Whistling Woods", area: "Kokapet", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 35, price: 4000, fc: 600 },
    { title: "Fashion Flea Market - Kokapet", date: "2026-04-04", venue: "Vertex Panache", area: "Kokapet", vType: "GATED_COMMUNITY", cat: "flea-market", eType: "WEEKEND_COMMUNITY", stalls: 20, price: 2000, fc: 400 },
    { title: "Mriga Events Lifestyle Carnival", date: "2026-04-04", venue: "Aparna Cyberlife", area: "Nallagandla", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 40, price: 4500, fc: 800 },
    { title: "V3s Events - Carnival Exhibition", date: "2026-04-04", venue: "SMR Vinay Iconia", area: "Kondapur", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 25, price: 3000, fc: 350 },
    { title: "Mini India Events Open Carnival", date: "2026-04-04", venue: "Spring Villas", area: "Nizampet", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 20, price: 2000, fc: 200 },
    { title: "Amogha Events - Special Outdoor Carnival", date: "2026-04-04", venue: "Fortune Greenhomes Sapphire", area: "Tellapur", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 30, price: 3500, fc: 450 },
    { title: "Lifestyle Exhibition - Nallagandla", date: "2026-04-04", venue: "Muppa Green Grandeur", area: "Nallagandla", vType: "GATED_COMMUNITY", cat: "lifestyle-exhibition", eType: "WEEKEND_COMMUNITY", stalls: 20, price: 2500, fc: 300 },
    { title: "Celebration Makers Carnival", date: "2026-04-04", venue: "Aparna Sarovar Zenith", area: "Nallagandla", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 35, price: 4000, fc: 700 },
    { title: "V3s Aura Events Exhibition", date: "2026-04-05", venue: "Club Zeus Lanco Hills", area: "Manikonda", vType: "GATED_COMMUNITY", cat: "lifestyle-exhibition", eType: "WEEKEND_COMMUNITY", stalls: 50, price: 5000, fc: 1200 },
    { title: "Naksh Open Sky Events", date: "2026-04-05", venue: "My Home Navadweepa", area: "Madhapur", vType: "GATED_COMMUNITY", cat: "lifestyle-exhibition", eType: "WEEKEND_COMMUNITY", stalls: 30, price: 3500, fc: 500 },
    { title: "Amogha Events - Carnival-Style Exhibition", date: "2026-04-05", venue: "Indus Crest", area: "Tellapur", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 25, price: 3000, fc: 300 },
    { title: "Celestia Events Carnival - LB Nagar", date: "2026-04-05", venue: "Vasavi Sri Nilayam", area: "LB Nagar", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 20, price: 2500, fc: 200 },
    { title: "Maguva Mega Mela", date: "2026-04-05", venue: "Gem Nakshtra", area: "Kokapet", vType: "GATED_COMMUNITY", cat: "mega-mela", eType: "WEEKEND_COMMUNITY", stalls: 45, price: 4000, fc: 350 },
    { title: "Celebration Makers - KPHB", date: "2026-04-05", venue: "RainTree Park", area: "KPHB", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 30, price: 3000, fc: 600 },
    { title: "Mriga Events Corporate Carnival", date: "2026-04-07", venue: "Orbit Auro Reality", area: "Raidurg", vType: "CORPORATE_OFFICE", cat: "corporate", eType: "WEEKDAY_CORPORATE", stalls: 20, price: 5000, ec: 2000 },
    { title: "Vismaya Events - Corporate Flea Market", date: "2026-04-08", venue: "LTI Mindtree", area: "Kondapur", vType: "CORPORATE_OFFICE", cat: "corporate", eType: "WEEKDAY_CORPORATE", stalls: 25, price: 5500, ec: 5000 },
    { title: "Ss Events - BSR Vamsirams", date: "2026-04-08", venue: "BSR Vamsirams", area: "Hyderabad", vType: "GATED_COMMUNITY", cat: "lifestyle-exhibition", eType: "WEEKEND_COMMUNITY", stalls: 20, price: 2500, fc: 400 },
    { title: "Corporate Flea Carnival - Wave Rock", date: "2026-04-09", venue: "Wave Rock", area: "Nanakramguda", vType: "CORPORATE_OFFICE", cat: "corporate", eType: "WEEKDAY_CORPORATE", stalls: 30, price: 6000, ec: 8000 },
    { title: "Ss Events - ADP Financial District", date: "2026-04-09", venue: "ADP Office", area: "Nanakramguda", vType: "CORPORATE_OFFICE", cat: "corporate", eType: "WEEKDAY_CORPORATE", stalls: 20, price: 5000, ec: 3000 },
    { title: "The Women Expo Summer Carnival - Pocharam", date: "2026-04-11", venue: "Sanskruti Township", area: "Pocharam", vType: "GATED_COMMUNITY", cat: "women-expo", eType: "WEEKEND_COMMUNITY", stalls: 35, price: 3000, fc: 400 },
    { title: "Summer Carnival - Nagole", date: "2026-04-11", venue: "Sahabhavana Township", area: "Nagole", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 30, price: 2500, fc: 500 },
    { title: "Srk Events - Nizampet", date: "2026-04-11", venue: "Aditya Lagoon", area: "Nizampet", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 20, price: 2500, fc: 300 },
    { title: "Rainbow Events - Nallagandla", date: "2026-04-11", venue: "Aparna Cyber Commune", area: "Nallagandla", vType: "GATED_COMMUNITY", cat: "lifestyle-exhibition", eType: "WEEKEND_COMMUNITY", stalls: 40, price: 4000, fc: 900 },
    { title: "V3s Events - Carnival at Gachibowli", date: "2026-04-11", venue: "My Home Vihanga", area: "Gachibowli", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 45, price: 4500, fc: 1000 },
    { title: "Celebration Makers Grandsociety Brand Expo", date: "2026-04-12", venue: "Vasavi GP Trends", area: "Nanakramguda", vType: "GATED_COMMUNITY", cat: "brand-expo", eType: "WEEKEND_COMMUNITY", stalls: 50, price: 5000, fc: 400 },
    { title: "2000 Flats - Vismaya Summer Carnival", date: "2026-04-12", venue: "Myhome Mangala", area: "Kondapur", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 60, price: 5000, fc: 2000 },
    { title: "Family Carnival - Medchal", date: "2026-04-12", venue: "Sanjana Courtyard", area: "Medchal", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 20, price: 2000, fc: 250 },
    { title: "Mriga Events Carnival - Chandanagar", date: "2026-04-12", venue: "My Home Jewel", area: "Chandanagar", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 30, price: 3500, fc: 600 },
    { title: "V3s Events - Carnival at Chandanagar", date: "2026-04-12", venue: "Aparna Lake Breeze", area: "Chandanagar", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 25, price: 3000, fc: 500 },
    { title: "Amogha Events - Outdoor Carnival Miyapur", date: "2026-04-12", venue: "Lakshmis Emperia", area: "Miyapur", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 25, price: 3000, fc: 350 },
    { title: "Corporate Event - Ascendas IT Park", date: "2026-04-15", venue: "Ascendas IT Park", area: "Madhapur", vType: "CORPORATE_OFFICE", cat: "corporate", eType: "WEEKDAY_CORPORATE", stalls: 25, price: 6000, ec: 10000 },
    { title: "Corporate Event - Capital Land", date: "2026-04-16", venue: "Capital Land IT Park", area: "Nanakramguda", vType: "CORPORATE_OFFICE", cat: "corporate", eType: "WEEKDAY_CORPORATE", stalls: 20, price: 5500, ec: 6000 },
    { title: "Corporate Flea Carnival - Waverock", date: "2026-04-17", venue: "Wave Rock 2", area: "Nanakramguda", vType: "CORPORATE_OFFICE", cat: "corporate", eType: "WEEKDAY_CORPORATE", stalls: 30, price: 6000, ec: 8000 },
    { title: "Fashion Files Exhibition", date: "2026-04-18", endDate: "2026-04-19", venue: "Om Convention", area: "Narsingi", vType: "CONVENTION_CENTER", cat: "fashion-exhibition", eType: "EXHIBITION", stalls: 70, price: 5000 },
    { title: "Mriga Events Carnival - Moosapet", date: "2026-04-18", venue: "Marina Skies", area: "Moosapet", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 25, price: 3000, fc: 400 },
    { title: "V3s Events - Carnival at Moosapet", date: "2026-04-18", venue: "Rainbow Vistas Rock Garden", area: "Moosapet", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 50, price: 4500, fc: 1500 },
    { title: "Mriga Events Carnival - Tellapur", date: "2026-04-19", venue: "Honer Vivantis", area: "Tellapur", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 35, price: 4000, fc: 800 },
    { title: "Skanda Events - Corporate Flea Market", date: "2026-04-22", venue: "My Home Twitza", area: "Hitec City", vType: "GATED_COMMUNITY", cat: "flea-market", eType: "WEEKEND_COMMUNITY", stalls: 20, price: 5000, fc: 500 },
    { title: "Urban Pop Up - Banjara Hills", date: "2026-04-24", endDate: "2026-04-25", venue: "Labels The Pop Up Space", area: "Banjara Hills", vType: "OUTDOOR", cat: "pop-up-market", eType: "EXHIBITION", stalls: 30, price: 8000 },
    { title: "Celebration Makers - Grand Brand Expo", date: "2026-04-27", endDate: "2026-04-29", venue: "Aparna Serene Park", area: "Kondapur", vType: "GATED_COMMUNITY", cat: "brand-expo", eType: "WEEKEND_COMMUNITY", stalls: 60, price: 5000, fc: 1200 },
    { title: "Vismaya - LTI Mindtree Corporate Flea", date: "2026-04-29", endDate: "2026-04-30", venue: "LTI Mindtree Campus", area: "Kondapur", vType: "CORPORATE_OFFICE", cat: "corporate", eType: "WEEKDAY_CORPORATE", stalls: 30, price: 6000, ec: 5000 },
    { title: "Skanda Events - Corporate Flea ADP", date: "2026-04-30", venue: "ADP Campus", area: "Nanakramguda", vType: "CORPORATE_OFFICE", cat: "corporate", eType: "WEEKDAY_CORPORATE", stalls: 20, price: 5000, ec: 3000 },
    { title: "Wow Expo - Gachibowli", date: "2026-05-01", endDate: "2026-05-03", venue: "ESCI Convention Centre", area: "Gachibowli", vType: "CONVENTION_CENTER", cat: "brand-expo", eType: "EXHIBITION", stalls: 100, price: 8000 },
    { title: "Kapi Events Carnival - Narsingi", date: "2026-05-05", venue: "Accurate Wind Chimes", area: "Narsingi", vType: "GATED_COMMUNITY", cat: "carnival", eType: "WEEKEND_COMMUNITY", stalls: 30, price: 3500, fc: 600 },
    { title: "Leo Lifestyle Exhibition - May Edition", date: "2026-05-16", endDate: "2026-05-17", venue: "Sri Maaya Luxury Convention", area: "Kondapur", vType: "CONVENTION_CENTER", cat: "lifestyle-exhibition", eType: "EXHIBITION", stalls: 80, price: 6000 },
  ];

  let realCreated = 0;
  for (const e of realEvents) {
    const venueId = await getOrCreateVenue(e.venue, e.area, e.vType, {
      familyCount: (e as Record<string, unknown>).fc as number | undefined,
      employeeCount: (e as Record<string, unknown>).ec as number | undefined,
    });
    const categoryId = catMap[e.cat];
    if (!categoryId) {
      console.warn(`  Skipping "${e.title}" — category "${e.cat}" not found`);
      continue;
    }

    const slug = e.title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "") + "-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const startDate = new Date(e.date + "T10:00:00");
    const endDate = e.endDate ? new Date(e.endDate + "T18:00:00") : new Date(e.date + "T18:00:00");
    const bookedStalls = Math.floor(Math.random() * Math.floor(e.stalls * 0.5));

    try {
      const evt = await prisma.event.create({
        data: {
          title: e.title,
          slug,
          description: `Join us at ${e.venue}, ${e.area} for ${e.title}. A fantastic opportunity for vendors to showcase products to ${e.eType === "WEEKDAY_CORPORATE" ? "corporate employees" : "community residents"} in Hyderabad.`,
          shortDescription: `${e.stalls} stalls at ${e.venue}, ${e.area}`,
          categoryId,
          venueId,
          organizerId: manager.id,
          startDate,
          endDate,
          startTime: "10:00 AM",
          endTime: "6:00 PM",
          eventType: e.eType === "EXHIBITION" ? "WEEKEND_COMMUNITY" : e.eType,
          status: "PUBLISHED",
          maxStalls: e.stalls,
          bookedStalls,
          basePrice: e.price,
          isFeatured: e.stalls >= 40,
        },
      });

      // Category pool per event type so the demand heatmap shows real mix
      const catPool = e.eType === "WEEKDAY_CORPORATE"
        ? ["Fashion", "Food & Beverages", "Electronics", "Wellness", "Services", "Accessories"]
        : e.cat === "women-expo"
        ? ["Womens Wear", "Jewellery", "Beauty & Wellness", "Accessories", "Home Decor"]
        : e.cat === "wedding"
        ? ["Bridal Wear", "Jewellery", "Catering", "Photography", "Decor & Flowers"]
        : e.cat === "fashion-exhibition"
        ? ["Designer Wear", "Western Wear", "Ethnic Wear", "Accessories", "Footwear"]
        : e.cat === "flea-market"
        ? ["Pre-loved Fashion", "Books", "Handmade", "Accessories", "Vinyl"]
        : ["Fashion", "Food & Beverages", "Home Decor", "Jewellery", "Kids & Toys", "Plants & Garden", "Handicrafts"];

      const stallData = [];
      for (let i = 0; i < e.stalls; i++) {
        const isPremium = i < Math.floor(e.stalls * 0.2);
        const isCorner = i === 0 || i === Math.floor(e.stalls / 2) - 1;
        stallData.push({
          eventId: evt.id,
          stallNumber: `${i + 1}`,
          type: isCorner ? "CORNER" : isPremium ? "PREMIUM" : "STANDARD",
          size: isCorner ? "10x10" : isPremium ? "8x8" : "6x6",
          price: isCorner ? e.price * 1.5 : isPremium ? e.price * 1.2 : e.price,
          stallCategory: catPool[i % catPool.length],
          positionX: i % 8,
          positionY: Math.floor(i / 8),
          width: 1,
          height: 1,
          status: i < bookedStalls ? "BOOKED" : "AVAILABLE",
        });
      }
      await prisma.stall.createMany({ data: stallData });
      realCreated++;
    } catch (err) {
      console.warn(`  Error creating "${e.title}":`, (err as Error).message?.substring(0, 80));
    }
  }

  // ─── PAST EVENTS + BOOKINGS + REVIEWS (for Previous Events dropdown) ──
  // Today is 2026-04-24 in this seed. Past events span Oct 2025 → Mar 2026
  // at the three main venues, run by different event managers so the
  // "Most Repeated Companies" ranking on the venue dashboard has real data.

  const vendorsAll = [vendor, vendor2, vendor3, vendor4, vendor5];
  const managersForPast = [manager, manager2, manager3, manager4];

  type PastEventSpec = {
    title: string;
    venue: { id: string; name: string };
    organizer: { id: string; company: string };
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    categoryId: string;
    eventType: string;
    basePrice: number;
    maxStalls: number;
    stallCategories: string[];
    organiserNotes: string;
    reviews: { rating: number; title: string; comment: string; authorIndex: number }[];
  };

  const pastEventSpecs: PastEventSpec[] = [
    {
      title: "Diwali Bazaar 2025",
      venue: { id: venue1.id, name: venue1.name },
      organizer: { id: manager.id, company: "EventPro Solutions" },
      startDate: "2025-10-18",
      endDate: "2025-10-19",
      startTime: "10:00",
      endTime: "21:00",
      categoryId: categories[1].id,
      eventType: "WEEKEND_COMMUNITY",
      basePrice: 4000,
      maxStalls: 40,
      stallCategories: ["Womens Wear", "Home Decor", "Jewellery", "Sweets & Snacks", "Diyas & Lights", "Kids & Toys"],
      organiserNotes: "Residents were most excited about ethnic wear and sweets. Consider adding rangoli stalls next year. Evening footfall peaked 6-8pm.",
      reviews: [
        { rating: 5, title: "Best Diwali bazaar", comment: "Great footfall, sold out by noon on day 2. Community was very welcoming, definitely booking again!", authorIndex: 0 },
        { rating: 4, title: "Solid event", comment: "Good crowd, power supply was reliable. Parking was a bit cramped on day 1 but organiser sorted it quickly.", authorIndex: 1 },
        { rating: 5, title: "Loved it", comment: "Warm welcome from RWA. Handicraft buyers came specifically for Pochampally ikat.", authorIndex: 2 },
      ],
    },
    {
      title: "Mriga Winter Carnival",
      venue: { id: venue1.id, name: venue1.name },
      organizer: { id: manager2.id, company: "Mriga Events" },
      startDate: "2025-12-13",
      endDate: "2025-12-14",
      startTime: "11:00",
      endTime: "20:00",
      categoryId: categories[1].id,
      eventType: "WEEKEND_COMMUNITY",
      basePrice: 3500,
      maxStalls: 35,
      stallCategories: ["Winter Wear", "Food & Beverages", "Home Decor", "Plants & Garden", "Jewellery"],
      organiserNotes: "Cold evenings pushed food & hot beverage sales. Plants stall saw slow movement — maybe shift to Feb next time.",
      reviews: [
        { rating: 4, title: "Good event", comment: "Steady footfall, decent earnings. Wish there was a food court zone set up separately.", authorIndex: 1 },
        { rating: 5, title: "Exceeded expectations", comment: "Mriga team was super organized. Stall setup kit was delivered on time.", authorIndex: 3 },
        { rating: 4, title: "Worth it", comment: "Made my investment back by day 1 evening. Community WhatsApp group promoted it well.", authorIndex: 0 },
      ],
    },
    {
      title: "Pongal & Sankranti Fest",
      venue: { id: venue1.id, name: venue1.name },
      organizer: { id: manager.id, company: "EventPro Solutions" },
      startDate: "2026-01-14",
      endDate: "2026-01-15",
      startTime: "09:00",
      endTime: "19:00",
      categoryId: categories[1].id,
      eventType: "WEEKEND_COMMUNITY",
      basePrice: 3000,
      maxStalls: 30,
      stallCategories: ["Traditional Wear", "Sweets & Snacks", "Handicrafts", "Pooja Items", "Food & Beverages"],
      organiserNotes: "Traditional/pooja items were top sellers. Day 1 morning was slow; day 2 was fantastic. Sankranti kite stalls would be a good addition.",
      reviews: [
        { rating: 5, title: "Amazing response", comment: "Sold out of traditional sarees in 3 hours. Residents appreciated authentic products.", authorIndex: 0 },
        { rating: 4, title: "Good festival vibe", comment: "Biryani stall was a huge hit, queue went around the clubhouse. Logistics were smooth.", authorIndex: 1 },
      ],
    },
    {
      title: "Celebration Makers Brand Expo",
      venue: { id: venue1.id, name: venue1.name },
      organizer: { id: manager4.id, company: "Celebration Makers" },
      startDate: "2026-02-28",
      endDate: "2026-03-01",
      startTime: "10:00",
      endTime: "21:00",
      categoryId: catMap["brand-expo"],
      eventType: "WEEKEND_COMMUNITY",
      basePrice: 4500,
      maxStalls: 45,
      stallCategories: ["Fashion", "Jewellery", "Home Decor", "Food & Beverages", "Electronics", "Wellness"],
      organiserNotes: "Great turnout from neighbouring societies too. Power tripped once on day 1 — venue needs a genset backup for premium stalls.",
      reviews: [
        { rating: 4, title: "Good footfall, power issue", comment: "Day 1 power tripped mid-evening but was fixed in 30 min. Otherwise brilliant footfall and sales.", authorIndex: 3 },
        { rating: 5, title: "Best branding event", comment: "Celebration Makers handled promotion excellently. Walk-ins were continuous.", authorIndex: 4 },
        { rating: 4, title: "Recommended", comment: "Premium stall was worth the extra price — corner location got double the traffic.", authorIndex: 0 },
      ],
    },
    // ── DLF Cyber City past events ───────────────────────────────────────
    {
      title: "Diwali Corporate Expo 2025",
      venue: { id: venue2.id, name: venue2.name },
      organizer: { id: manager.id, company: "EventPro Solutions" },
      startDate: "2025-10-27",
      endDate: "2025-10-29",
      startTime: "09:00",
      endTime: "18:00",
      categoryId: categories[0].id,
      eventType: "WEEKDAY_CORPORATE",
      basePrice: 8000,
      maxStalls: 50,
      stallCategories: ["Electronics", "Fashion", "Food Court", "Gifting", "Wellness", "Home Appliances"],
      organiserNotes: "Lunch-hour (12-2pm) drove 60% of sales. Gifting and home decor was top selling ahead of Diwali. High-spend audience — premium pricing works here.",
      reviews: [
        { rating: 5, title: "Premium audience", comment: "Average bill value was 3x my regular community events. Corporate crowd spends more.", authorIndex: 0 },
        { rating: 5, title: "Great ROI", comment: "Recovered my 3-day stall cost by end of day 1. DLF security was strict but professional.", authorIndex: 4 },
        { rating: 4, title: "Good but expensive", comment: "Stall fee is steep but worth it. Wifi and AC were rock solid.", authorIndex: 1 },
      ],
    },
    {
      title: "Vismaya Corporate Flea Market",
      venue: { id: venue2.id, name: venue2.name },
      organizer: { id: manager3.id, company: "Vismaya Events" },
      startDate: "2025-11-19",
      endDate: "2025-11-20",
      startTime: "10:00",
      endTime: "17:00",
      categoryId: categories[0].id,
      eventType: "WEEKDAY_CORPORATE",
      basePrice: 6500,
      maxStalls: 40,
      stallCategories: ["Fashion", "Accessories", "Food & Beverages", "Tech Gadgets", "Handmade"],
      organiserNotes: "Two-day format works better than three for corporate events. Day 3 historically sees 40% drop. Handmade/artisan stalls did surprisingly well.",
      reviews: [
        { rating: 4, title: "Smooth operation", comment: "Vismaya team was responsive on WhatsApp. Quick payment settlement post-event.", authorIndex: 2 },
        { rating: 5, title: "Best corporate event", comment: "Employees at DLF are aware of quality brands. Handicrafts sold out on day 1.", authorIndex: 2 },
      ],
    },
    {
      title: "Republic Day IT Expo",
      venue: { id: venue2.id, name: venue2.name },
      organizer: { id: manager.id, company: "EventPro Solutions" },
      startDate: "2026-01-22",
      endDate: "2026-01-23",
      startTime: "09:00",
      endTime: "18:00",
      categoryId: categories[0].id,
      eventType: "WEEKDAY_CORPORATE",
      basePrice: 7000,
      maxStalls: 45,
      stallCategories: ["Electronics", "Fashion", "Food Court", "Services", "Wellness"],
      organiserNotes: "Patriotic-themed merchandise did very well. Consider a dedicated 'Made in India' zone for next year's edition.",
      reviews: [
        { rating: 4, title: "Good event", comment: "Decent footfall considering it was a weekday. Food court stalls were packed at lunch.", authorIndex: 1 },
        { rating: 5, title: "Loved the theme", comment: "Patriotic theme drew strong crowd. Corporate employees enjoyed the decor.", authorIndex: 0 },
      ],
    },
    {
      title: "Mriga Corporate Spring Carnival",
      venue: { id: venue2.id, name: venue2.name },
      organizer: { id: manager2.id, company: "Mriga Events" },
      startDate: "2026-03-18",
      endDate: "2026-03-19",
      startTime: "10:00",
      endTime: "18:00",
      categoryId: categories[0].id,
      eventType: "WEEKDAY_CORPORATE",
      basePrice: 7500,
      maxStalls: 40,
      stallCategories: ["Fashion", "Jewellery", "Food & Beverages", "Plants & Garden", "Services"],
      organiserNotes: "Spring/Holi themed decor attracted visitors. Plants and garden accessories were unexpectedly popular.",
      reviews: [
        { rating: 5, title: "Excellent organization", comment: "Mriga's setup was spotless. Power and Wifi never failed across two days.", authorIndex: 3 },
        { rating: 4, title: "Worth attending", comment: "Got 2 bulk orders from a company admin for corporate gifting. Great B2B leads.", authorIndex: 4 },
        { rating: 5, title: "Top notch", comment: "Best managed corporate event I've done this year.", authorIndex: 2 },
      ],
    },
    // ── HICC past events ─────────────────────────────────────────────────
    {
      title: "Hyderabad Wedding Expo - Winter 2025",
      venue: { id: venue3.id, name: venue3.name },
      organizer: { id: manager.id, company: "EventPro Solutions" },
      startDate: "2025-11-29",
      endDate: "2025-11-30",
      startTime: "10:00",
      endTime: "21:00",
      categoryId: categories[2].id,
      eventType: "WEDDING",
      basePrice: 14000,
      maxStalls: 80,
      stallCategories: ["Bridal Wear", "Jewellery", "Catering", "Photography", "Decor & Flowers", "Mehendi", "Invitations"],
      organiserNotes: "Peak wedding season brought serious buyers. Average booking value at jewellery stalls crossed Rs 2 lakh per visitor. Bridal wear stalls need more fitting rooms.",
      reviews: [
        { rating: 5, title: "Got 6 bookings", comment: "Signed 6 wedding clients over 2 days. HICC attracts serious budget buyers.", authorIndex: 4 },
        { rating: 4, title: "Worth the investment", comment: "Premium pricing is justified. High-quality leads, not just window shoppers.", authorIndex: 0 },
        { rating: 5, title: "Best wedding expo in Hyderabad", comment: "Professional setup, AC never failed, loading dock made setup easy.", authorIndex: 2 },
      ],
    },
    {
      title: "Celebration Makers Bridal Exhibition",
      venue: { id: venue3.id, name: venue3.name },
      organizer: { id: manager4.id, company: "Celebration Makers" },
      startDate: "2026-02-14",
      endDate: "2026-02-15",
      startTime: "11:00",
      endTime: "22:00",
      categoryId: categories[2].id,
      eventType: "WEDDING",
      basePrice: 13000,
      maxStalls: 70,
      stallCategories: ["Bridal Wear", "Jewellery", "Mehendi & Beauty", "Photography", "Catering", "Gifts"],
      organiserNotes: "Valentine's weekend timing helped. Young couples (engagement phase) made up 40% of visitors — bridal and photography stalls benefit.",
      reviews: [
        { rating: 5, title: "Flagship event", comment: "Celebration Makers did a stellar job. Got 4 confirmed bookings and 20+ leads.", authorIndex: 4 },
        { rating: 4, title: "Good organiser", comment: "Helpful team. Small issue with stall allocation on day 1 morning but resolved fast.", authorIndex: 2 },
      ],
    },
    {
      title: "Fashion Week Hyderabad",
      venue: { id: venue3.id, name: venue3.name },
      organizer: { id: manager3.id, company: "Vismaya Events" },
      startDate: "2026-03-06",
      endDate: "2026-03-08",
      startTime: "10:00",
      endTime: "21:00",
      categoryId: catMap["fashion-exhibition"],
      eventType: "EXHIBITION",
      basePrice: 12000,
      maxStalls: 60,
      stallCategories: ["Designer Wear", "Western Wear", "Accessories", "Footwear", "Beauty", "Jewellery"],
      organiserNotes: "3-day format stretched inventory. Day 3 footfall was half of day 1. Recommend 2-day format for vendors with limited SKUs.",
      reviews: [
        { rating: 4, title: "Stretched on day 3", comment: "First two days were amazing. Day 3 was slow — I was sold out of best-sellers by then.", authorIndex: 0 },
        { rating: 5, title: "Fashion buyer heaven", comment: "Serious fashion buyers came from Bangalore too. Got wholesale orders from two boutiques.", authorIndex: 4 },
        { rating: 4, title: "Good exposure", comment: "Brand visibility was the real ROI here. Got Instagram followers spike.", authorIndex: 2 },
      ],
    },
  ];

  // Build past events + their stalls + bookings + reviews + BNPL
  let pastCreated = 0;
  let bookingsCreated = 0;
  let reviewsCreated = 0;
  let bnplCreated = 0;
  let bookingSeq = 100;

  for (const spec of pastEventSpecs) {
    if (!spec.categoryId) continue;

    const slug = spec.title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "") + "-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const startDate = new Date(spec.startDate + "T" + spec.startTime + ":00");
    const endDate = new Date(spec.endDate + "T" + spec.endTime + ":00");

    const pastEvent = await prisma.event.create({
      data: {
        title: spec.title,
        slug,
        description: `${spec.title} hosted at ${spec.venue.name} by ${spec.organizer.company}. A successful event with strong footfall and vendor satisfaction.`,
        shortDescription: `Past event at ${spec.venue.name}`,
        categoryId: spec.categoryId,
        venueId: spec.venue.id,
        organizerId: spec.organizer.id,
        startDate,
        endDate,
        startTime: spec.startTime,
        endTime: spec.endTime,
        eventType: spec.eventType,
        status: "COMPLETED",
        maxStalls: spec.maxStalls,
        bookedStalls: 0, // set after bookings
        basePrice: spec.basePrice,
        stallCategories: JSON.stringify(spec.stallCategories),
        lastEventInfo: spec.organiserNotes,
      },
    });

    // Create stalls for this past event. Book the first N, leave rest AVAILABLE.
    const bookCount = Math.min(vendorsAll.length, Math.max(3, Math.floor(spec.maxStalls * 0.6)));
    const stallsToCreate = [];
    for (let i = 0; i < spec.maxStalls; i++) {
      const isPremium = i < Math.floor(spec.maxStalls * 0.15);
      const isCorner = i === 0 || i === spec.maxStalls - 1;
      const category = spec.stallCategories[i % spec.stallCategories.length];
      stallsToCreate.push({
        eventId: pastEvent.id,
        stallNumber: `${i + 1}`,
        type: isCorner ? "CORNER" : isPremium ? "PREMIUM" : "STANDARD",
        size: isCorner ? "10x10" : isPremium ? "8x8" : "6x6",
        price: isCorner ? spec.basePrice * 1.5 : isPremium ? spec.basePrice * 1.2 : spec.basePrice,
        stallCategory: category,
        positionX: i % 8,
        positionY: Math.floor(i / 8),
        width: 1,
        height: 1,
        status: i < bookCount ? "BOOKED" : "AVAILABLE",
      });
    }
    await prisma.stall.createMany({ data: stallsToCreate });

    // Create bookings — one per vendor (rotating) for the first bookCount stalls
    const createdStalls = await prisma.stall.findMany({
      where: { eventId: pastEvent.id },
      orderBy: { stallNumber: "asc" },
      take: bookCount,
    });

    for (let i = 0; i < createdStalls.length; i++) {
      const st = createdStalls[i];
      const v = vendorsAll[i % vendorsAll.length];
      const amount = st.price;
      const tax = Math.round(amount * 0.18);
      // Alternate payment modes: some BNPL, rest upfront
      const isBnpl = i % 4 === 3;
      const paymentMode = isBnpl ? "BNPL" : "UPFRONT";

      const booking = await prisma.booking.create({
        data: {
          bookingNumber: `SM-PAST-${bookingSeq++}`,
          eventId: pastEvent.id,
          stallId: st.id,
          vendorId: v.id,
          stallCategory: st.stallCategory,
          status: "COMPLETED",
          amount,
          tax,
          totalAmount: amount + tax,
          paymentStatus: "PAID",
          paymentMode,
          paidAt: new Date(endDate.getTime() - 5 * 24 * 60 * 60 * 1000),
          createdAt: new Date(startDate.getTime() - 14 * 24 * 60 * 60 * 1000),
        },
      });
      bookingsCreated++;

      if (isBnpl) {
        await prisma.bNPLAgreement.create({
          data: {
            bookingId: booking.id,
            vendorId: v.id,
            amount: amount + tax,
            dueDate: new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            status: "SETTLED",
            settledAt: new Date(endDate.getTime() + 10 * 24 * 60 * 60 * 1000),
          },
        });
        bnplCreated++;
      }
    }

    await prisma.event.update({
      where: { id: pastEvent.id },
      data: { bookedStalls: bookCount },
    });

    // Reviews from vendors targeting the organizer
    for (const r of spec.reviews) {
      const author = vendorsAll[r.authorIndex] ?? vendorsAll[0];
      await prisma.review.create({
        data: {
          eventId: pastEvent.id,
          authorId: author.id,
          targetId: spec.organizer.id,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          reviewType: "EVENT_REVIEW",
          createdAt: new Date(endDate.getTime() + 2 * 24 * 60 * 60 * 1000),
        },
      });
      reviewsCreated++;
    }

    pastCreated++;
  }

  console.log(`Created ${pastCreated} past events, ${bookingsCreated} completed bookings, ${reviewsCreated} reviews, ${bnplCreated} BNPL agreements`);

  // ─── UPCOMING EVENTS IN 60-DAY WINDOW (for calendar busy-day highlighting) ──
  // Today is 2026-04-24. Add events scattered across May-June 2026 at main venues.
  const upcomingSpecs: Array<{
    title: string;
    venueId: string;
    organizerId: string;
    startDate: string;
    endDate: string;
    categoryId: string;
    eventType: string;
    basePrice: number;
    maxStalls: number;
    stallCategories: string[];
  }> = [
    {
      title: "Summer Weekend Mela - Aparna",
      venueId: venue1.id,
      organizerId: manager2.id,
      startDate: "2026-05-02",
      endDate: "2026-05-03",
      categoryId: categories[1].id,
      eventType: "WEEKEND_COMMUNITY",
      basePrice: 3500,
      maxStalls: 35,
      stallCategories: ["Summer Wear", "Cool Beverages", "Ice Cream", "Kids & Toys", "Plants & Garden"],
    },
    {
      title: "Mothers Day Bazaar",
      venueId: venue1.id,
      organizerId: manager4.id,
      startDate: "2026-05-10",
      endDate: "2026-05-10",
      categoryId: categories[1].id,
      eventType: "WEEKEND_COMMUNITY",
      basePrice: 3000,
      maxStalls: 25,
      stallCategories: ["Jewellery", "Sarees", "Home Decor", "Wellness", "Sweets"],
    },
    {
      title: "Tech Showcase at DLF",
      venueId: venue2.id,
      organizerId: manager3.id,
      startDate: "2026-05-13",
      endDate: "2026-05-15",
      categoryId: categories[0].id,
      eventType: "WEEKDAY_CORPORATE",
      basePrice: 8500,
      maxStalls: 50,
      stallCategories: ["Electronics", "Gadgets", "Tech Accessories", "Food Court", "Wellness"],
    },
    {
      title: "Summer Flea at Aparna",
      venueId: venue1.id,
      organizerId: manager3.id,
      startDate: "2026-05-24",
      endDate: "2026-05-24",
      categoryId: catMap["flea-market"],
      eventType: "WEEKEND_COMMUNITY",
      basePrice: 2500,
      maxStalls: 30,
      stallCategories: ["Pre-loved Fashion", "Books", "Vinyl", "Handmade", "Accessories"],
    },
    {
      title: "HICC Summer Lifestyle Fair",
      venueId: venue3.id,
      organizerId: manager.id,
      startDate: "2026-06-06",
      endDate: "2026-06-07",
      categoryId: catMap["lifestyle-exhibition"],
      eventType: "EXHIBITION",
      basePrice: 11000,
      maxStalls: 70,
      stallCategories: ["Fashion", "Home Decor", "Jewellery", "Wellness", "Food Court"],
    },
    {
      title: "Corporate Fiesta at DLF",
      venueId: venue2.id,
      organizerId: manager.id,
      startDate: "2026-06-17",
      endDate: "2026-06-18",
      categoryId: categories[0].id,
      eventType: "WEEKDAY_CORPORATE",
      basePrice: 7500,
      maxStalls: 45,
      stallCategories: ["Fashion", "Food Court", "Electronics", "Services"],
    },
  ];

  let upcomingCreated = 0;
  for (const u of upcomingSpecs) {
    if (!u.categoryId) continue;
    const slug = u.title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "") + "-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const sd = new Date(u.startDate + "T10:00:00");
    const ed = new Date(u.endDate + "T20:00:00");
    const evt = await prisma.event.create({
      data: {
        title: u.title,
        slug,
        description: `Upcoming event: ${u.title}. Book your stall early!`,
        shortDescription: `Upcoming - ${u.maxStalls} stalls`,
        categoryId: u.categoryId,
        venueId: u.venueId,
        organizerId: u.organizerId,
        startDate: sd,
        endDate: ed,
        startTime: "10:00",
        endTime: "20:00",
        eventType: u.eventType,
        status: "PUBLISHED",
        maxStalls: u.maxStalls,
        bookedStalls: Math.floor(u.maxStalls * 0.3),
        basePrice: u.basePrice,
        stallCategories: JSON.stringify(u.stallCategories),
        isFeatured: u.maxStalls >= 45,
      },
    });

    const stallData = [];
    for (let i = 0; i < u.maxStalls; i++) {
      stallData.push({
        eventId: evt.id,
        stallNumber: `${i + 1}`,
        type: i < 5 ? "PREMIUM" : "STANDARD",
        size: i < 5 ? "8x8" : "6x6",
        price: i < 5 ? u.basePrice * 1.2 : u.basePrice,
        stallCategory: u.stallCategories[i % u.stallCategories.length],
        positionX: i % 8,
        positionY: Math.floor(i / 8),
        width: 1,
        height: 1,
        status: i < Math.floor(u.maxStalls * 0.3) ? "BOOKED" : "AVAILABLE",
      });
    }
    await prisma.stall.createMany({ data: stallData });
    upcomingCreated++;
  }
  console.log(`Created ${upcomingCreated} upcoming events for 60-day calendar`);

  // ─── DEMAND VOTES (resident-requested categories per venue) ──────────
  const demandVotesData: { venueId: string; category: string; count: number }[] = [
    { venueId: venue1.id, category: "Food & Beverages", count: 12 },
    { venueId: venue1.id, category: "Clothing & Fashion", count: 8 },
    { venueId: venue1.id, category: "Plants & Garden", count: 5 },
    { venueId: venue1.id, category: "Kids & Toys", count: 7 },
    { venueId: venue2.id, category: "Food & Beverages", count: 18 },
    { venueId: venue2.id, category: "Electronics", count: 11 },
    { venueId: venue2.id, category: "Wellness", count: 6 },
    { venueId: venue3.id, category: "Jewellery", count: 9 },
    { venueId: venue3.id, category: "Bridal Wear", count: 14 },
  ];
  const demandRows: { venueId: string; category: string; residentName: string; residentPhone: string }[] = [];
  let nameIdx = 1;
  for (const d of demandVotesData) {
    for (let i = 0; i < d.count; i++) {
      demandRows.push({
        venueId: d.venueId,
        category: d.category,
        residentName: `Resident ${nameIdx++}`,
        residentPhone: `+91 98${String(100000 + nameIdx).padStart(8, "0")}`,
      });
    }
  }
  await prisma.demandVote.createMany({ data: demandRows });
  console.log(`Created ${demandRows.length} demand votes`);

  console.log(`Created ${realCreated} real Hyderabad events with stalls`);
  console.log("\n--- Seed complete! ---");
  console.log("\nTest accounts:");
  console.log("  Vendor: vendor@stallmate.in / password123");
  console.log("  Manager: manager@stallmate.in / password123");
  console.log("  Admin: admin@stallmate.in / password123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
