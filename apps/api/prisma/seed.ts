import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding NumberDepot database...\n');

  // ─── Clean existing data ───
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.portRequest.deleteMany();
  await prisma.brokerProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.phoneNumber.deleteMany();
  await prisma.user.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.staticPage.deleteMany();
  await prisma.platformSetting.deleteMany();

  const passwordHash = await bcrypt.hash('Admin123!', 12);
  const userHash = await bcrypt.hash('User1234!', 12);

  // ─── 1. Users ───
  console.log('👤 Creating users...');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@numberdepot.com', passwordHash, firstName: 'Admin', lastName: 'User',
      role: 'super_admin', status: 'active', emailVerified: true,
    },
  });

  const seller1 = await prisma.user.create({
    data: {
      email: 'mike.telecom@email.com', passwordHash: userHash, firstName: 'Mike', lastName: 'Johnson',
      role: 'seller', status: 'active', emailVerified: true, companyName: 'TeleNumbers Inc.',
      phone: '+12125550101',
    },
  });

  const seller2 = await prisma.user.create({
    data: {
      email: 'sarah.numbers@email.com', passwordHash: userHash, firstName: 'Sarah', lastName: 'Williams',
      role: 'seller', status: 'active', emailVerified: true, companyName: 'VanityLine Corp',
      phone: '+13105550202',
    },
  });

  const buyer1 = await prisma.user.create({
    data: {
      email: 'john.doe@email.com', passwordHash: userHash, firstName: 'John', lastName: 'Doe',
      role: 'buyer', status: 'active', emailVerified: true, phone: '+14155550301',
    },
  });

  const buyer2 = await prisma.user.create({
    data: {
      email: 'jane.smith@email.com', passwordHash: userHash, firstName: 'Jane', lastName: 'Smith',
      role: 'buyer', status: 'active', emailVerified: true, phone: '+17185550302',
    },
  });

  const buyer3 = await prisma.user.create({
    data: {
      email: 'robert.chen@email.com', passwordHash: userHash, firstName: 'Robert', lastName: 'Chen',
      role: 'buyer', status: 'active', phone: '+12135550303',
    },
  });

  // ─── 2. Broker Profiles ───
  console.log('🏪 Creating broker profiles...');

  const broker1 = await prisma.brokerProfile.create({
    data: {
      userId: seller1.id, businessName: 'TeleNumbers Inc.', businessType: 'business',
      commissionRate: 10.00, status: 'approved', approvedAt: new Date(),
      affiliateCode: 'NDP-MIKE2026', totalSales: 15, totalRevenue: 4500.00,
      availableBalance: 850.00, pendingBalance: 320.00,
    },
  });

  const broker2 = await prisma.brokerProfile.create({
    data: {
      userId: seller2.id, businessName: 'VanityLine Corp', businessType: 'business',
      commissionRate: 10.00, status: 'approved', approvedAt: new Date(),
      affiliateCode: 'NDP-SARAH026', totalSales: 8, totalRevenue: 12500.00,
      availableBalance: 2200.00, pendingBalance: 750.00,
    },
  });

  // ─── 3. Phone Numbers (60+) ───
  console.log('📱 Creating phone numbers...');

  const phoneNumbersData = [
    // Local numbers
    { number: '+12125559876', formatted: '(212) 555-9876', areaCode: '212', numberType: 'local', basePrice: 15.00, stateName: 'New York', cityName: 'New York', searchText: 'new york nyc manhattan' },
    { number: '+12125551234', formatted: '(212) 555-1234', areaCode: '212', numberType: 'local', basePrice: 25.00, stateName: 'New York', cityName: 'New York', pattern: 'sequential', searchText: 'new york sequential 1234' },
    { number: '+12125550000', formatted: '(212) 555-0000', areaCode: '212', numberType: 'local', basePrice: 150.00, stateName: 'New York', cityName: 'New York', pattern: 'repeater', isPremium: true, searchText: 'new york premium repeater 0000' },
    { number: '+13105551234', formatted: '(310) 555-1234', areaCode: '310', numberType: 'local', basePrice: 20.00, stateName: 'California', cityName: 'Los Angeles', searchText: 'los angeles california la' },
    { number: '+13105559999', formatted: '(310) 555-9999', areaCode: '310', numberType: 'local', basePrice: 200.00, stateName: 'California', cityName: 'Los Angeles', pattern: 'repeater', isPremium: true, searchText: 'los angeles premium repeater 9999' },
    { number: '+14155550123', formatted: '(415) 555-0123', areaCode: '415', numberType: 'local', basePrice: 12.00, stateName: 'California', cityName: 'San Francisco', searchText: 'san francisco bay area california' },
    { number: '+14155554567', formatted: '(415) 555-4567', areaCode: '415', numberType: 'local', basePrice: 18.00, stateName: 'California', cityName: 'San Francisco', pattern: 'sequential', searchText: 'san francisco sequential 4567' },
    { number: '+13125557890', formatted: '(312) 555-7890', areaCode: '312', numberType: 'local', basePrice: 10.00, stateName: 'Illinois', cityName: 'Chicago', searchText: 'chicago illinois downtown' },
    { number: '+13125551111', formatted: '(312) 555-1111', areaCode: '312', numberType: 'local', basePrice: 85.00, stateName: 'Illinois', cityName: 'Chicago', pattern: 'repeater', isPremium: true, searchText: 'chicago repeater 1111' },
    { number: '+17135550456', formatted: '(713) 555-0456', areaCode: '713', numberType: 'local', basePrice: 8.00, stateName: 'Texas', cityName: 'Houston', searchText: 'houston texas' },
    { number: '+12145559012', formatted: '(214) 555-9012', areaCode: '214', numberType: 'local', basePrice: 10.00, stateName: 'Texas', cityName: 'Dallas', searchText: 'dallas texas' },
    { number: '+16025553456', formatted: '(602) 555-3456', areaCode: '602', numberType: 'local', basePrice: 7.00, stateName: 'Arizona', cityName: 'Phoenix', searchText: 'phoenix arizona' },
    { number: '+13035557890', formatted: '(303) 555-7890', areaCode: '303', numberType: 'local', basePrice: 9.00, stateName: 'Colorado', cityName: 'Denver', searchText: 'denver colorado' },
    { number: '+12065551234', formatted: '(206) 555-1234', areaCode: '206', numberType: 'local', basePrice: 14.00, stateName: 'Washington', cityName: 'Seattle', searchText: 'seattle washington' },
    { number: '+15035550789', formatted: '(503) 555-0789', areaCode: '503', numberType: 'local', basePrice: 11.00, stateName: 'Oregon', cityName: 'Portland', searchText: 'portland oregon' },
    { number: '+16175551234', formatted: '(617) 555-1234', areaCode: '617', numberType: 'local', basePrice: 16.00, stateName: 'Massachusetts', cityName: 'Boston', searchText: 'boston massachusetts' },
    { number: '+14045558765', formatted: '(404) 555-8765', areaCode: '404', numberType: 'local', basePrice: 13.00, stateName: 'Georgia', cityName: 'Atlanta', searchText: 'atlanta georgia' },
    { number: '+13055552468', formatted: '(305) 555-2468', areaCode: '305', numberType: 'local', basePrice: 22.00, stateName: 'Florida', cityName: 'Miami', searchText: 'miami florida beach' },
    { number: '+17025553579', formatted: '(702) 555-3579', areaCode: '702', numberType: 'local', basePrice: 10.00, stateName: 'Nevada', cityName: 'Las Vegas', searchText: 'las vegas nevada' },
    { number: '+16155554321', formatted: '(615) 555-4321', areaCode: '615', numberType: 'local', basePrice: 9.00, stateName: 'Tennessee', cityName: 'Nashville', searchText: 'nashville tennessee music' },

    // Vanity numbers
    { number: '+12125553569', formatted: '(212) 555-FLOW', areaCode: '212', numberType: 'vanity', basePrice: 500.00, vanityText: 'FLOW', isVanity: true, isPremium: true, stateName: 'New York', cityName: 'New York', searchText: 'flow vanity new york premium' },
    { number: '+13105552273', formatted: '(310) 555-CARE', areaCode: '310', numberType: 'vanity', basePrice: 350.00, vanityText: 'CARE', isVanity: true, isPremium: true, stateName: 'California', cityName: 'Los Angeles', searchText: 'care vanity los angeles health' },
    { number: '+14155557325', formatted: '(415) 555-REAL', areaCode: '415', numberType: 'vanity', basePrice: 275.00, vanityText: 'REAL', isVanity: true, stateName: 'California', cityName: 'San Francisco', searchText: 'real vanity san francisco estate' },
    { number: '+17135554663', formatted: '(713) 555-HOME', areaCode: '713', numberType: 'vanity', basePrice: 425.00, vanityText: 'HOME', isVanity: true, isPremium: true, stateName: 'Texas', cityName: 'Houston', searchText: 'home vanity houston real estate' },
    { number: '+13125554386', formatted: '(312) 555-HELP', areaCode: '312', numberType: 'vanity', basePrice: 600.00, vanityText: 'HELP', isVanity: true, isPremium: true, stateName: 'Illinois', cityName: 'Chicago', searchText: 'help vanity chicago support' },

    // Toll-free numbers
    { number: '+18005551234', formatted: '(800) 555-1234', areaCode: '800', numberType: 'toll_free', basePrice: 30.00, searchText: 'toll free 800 nationwide' },
    { number: '+18005559999', formatted: '(800) 555-9999', areaCode: '800', numberType: 'toll_free', basePrice: 500.00, pattern: 'repeater', isPremium: true, searchText: 'toll free 800 premium repeater 9999' },
    { number: '+18005557325', formatted: '(800) 555-REAL', areaCode: '800', numberType: 'toll_free', basePrice: 2500.00, vanityText: 'REAL', isVanity: true, isPremium: true, searchText: 'toll free 800 vanity real estate premium' },
    { number: '+18005554253', formatted: '(800) 555-HALE', areaCode: '800', numberType: 'toll_free', basePrice: 150.00, vanityText: 'HALE', isVanity: true, searchText: 'toll free 800 vanity hale health' },
    { number: '+18885550001', formatted: '(888) 555-0001', areaCode: '888', numberType: 'toll_free', basePrice: 25.00, searchText: 'toll free 888 nationwide' },
    { number: '+18885558888', formatted: '(888) 555-8888', areaCode: '888', numberType: 'toll_free', basePrice: 750.00, pattern: 'repeater', isPremium: true, searchText: 'toll free 888 premium repeater' },
    { number: '+18775551234', formatted: '(877) 555-1234', areaCode: '877', numberType: 'toll_free', basePrice: 20.00, searchText: 'toll free 877 nationwide' },
    { number: '+18665550505', formatted: '(866) 555-0505', areaCode: '866', numberType: 'toll_free', basePrice: 35.00, pattern: 'repeater', searchText: 'toll free 866 repeater' },
    { number: '+18555551212', formatted: '(855) 555-1212', areaCode: '855', numberType: 'toll_free', basePrice: 15.00, searchText: 'toll free 855 nationwide' },
    { number: '+18445550000', formatted: '(844) 555-0000', areaCode: '844', numberType: 'toll_free', basePrice: 100.00, pattern: 'repeater', isPremium: true, searchText: 'toll free 844 premium repeater 0000' },

    // More local for variety
    { number: '+19175551010', formatted: '(917) 555-1010', areaCode: '917', numberType: 'local', basePrice: 35.00, stateName: 'New York', cityName: 'New York', pattern: 'repeater', searchText: 'new york mobile 917' },
    { number: '+13475552020', formatted: '(347) 555-2020', areaCode: '347', numberType: 'local', basePrice: 30.00, stateName: 'New York', cityName: 'Brooklyn', pattern: 'repeater', searchText: 'brooklyn new york 347' },
    { number: '+12135553030', formatted: '(213) 555-3030', areaCode: '213', numberType: 'local', basePrice: 28.00, stateName: 'California', cityName: 'Los Angeles', pattern: 'repeater', searchText: 'los angeles downtown 213' },
    { number: '+14085554040', formatted: '(408) 555-4040', areaCode: '408', numberType: 'local', basePrice: 22.00, stateName: 'California', cityName: 'San Jose', pattern: 'repeater', searchText: 'san jose silicon valley 408' },
    { number: '+19495555050', formatted: '(949) 555-5050', areaCode: '949', numberType: 'local', basePrice: 25.00, stateName: 'California', cityName: 'Irvine', pattern: 'repeater', searchText: 'irvine orange county 949' },
    { number: '+17325550321', formatted: '(732) 555-0321', areaCode: '732', numberType: 'local', basePrice: 8.00, stateName: 'New Jersey', cityName: 'Edison', searchText: 'new jersey edison' },
    { number: '+12675551776', formatted: '(267) 555-1776', areaCode: '267', numberType: 'local', basePrice: 45.00, stateName: 'Pennsylvania', cityName: 'Philadelphia', searchText: 'philadelphia pennsylvania 1776' },
    { number: '+14435550808', formatted: '(443) 555-0808', areaCode: '443', numberType: 'local', basePrice: 12.00, stateName: 'Maryland', cityName: 'Baltimore', searchText: 'baltimore maryland' },
    { number: '+12025551600', formatted: '(202) 555-1600', areaCode: '202', numberType: 'local', basePrice: 55.00, stateName: 'Washington DC', cityName: 'Washington', searchText: 'washington dc capitol' },
    { number: '+15165550420', formatted: '(516) 555-0420', areaCode: '516', numberType: 'local', basePrice: 10.00, stateName: 'New York', cityName: 'Long Island', searchText: 'long island new york 516' },

    // Canadian numbers
    { number: '+14165551234', formatted: '(416) 555-1234', areaCode: '416', numberType: 'canadian', basePrice: 15.00, stateName: 'Ontario', cityName: 'Toronto', searchText: 'toronto ontario canada' },
    { number: '+16045559876', formatted: '(604) 555-9876', areaCode: '604', numberType: 'canadian', basePrice: 12.00, stateName: 'British Columbia', cityName: 'Vancouver', searchText: 'vancouver british columbia canada' },
    { number: '+15145551234', formatted: '(514) 555-1234', areaCode: '514', numberType: 'canadian', basePrice: 10.00, stateName: 'Quebec', cityName: 'Montreal', searchText: 'montreal quebec canada french' },

    // UK numbers
    { number: '+442071234567', formatted: '+44 207 123 4567', areaCode: '207', numberType: 'uk', basePrice: 20.00, stateName: 'England', cityName: 'London', countryCode: '+44', searchText: 'london england uk united kingdom' },
    { number: '+441611234567', formatted: '+44 161 123 4567', areaCode: '161', numberType: 'uk', basePrice: 15.00, stateName: 'England', cityName: 'Manchester', countryCode: '+44', searchText: 'manchester england uk' },

    // More premium vanity
    { number: '+18005554386', formatted: '(800) 555-HELP', areaCode: '800', numberType: 'toll_free', basePrice: 5000.00, vanityText: 'HELP', isVanity: true, isPremium: true, searchText: 'toll free 800 vanity help support premium' },
    { number: '+18885552253', formatted: '(888) 555-BAKE', areaCode: '888', numberType: 'toll_free', basePrice: 800.00, vanityText: 'BAKE', isVanity: true, searchText: 'toll free 888 vanity bake bakery food' },
    { number: '+18775555283', formatted: '(877) 555-JAVE', areaCode: '877', numberType: 'toll_free', basePrice: 350.00, vanityText: 'JAVE', isVanity: true, searchText: 'toll free 877 vanity java coffee' },
  ];

  const phoneNumbers = [];
  for (const pn of phoneNumbersData) {
    const created = await prisma.phoneNumber.create({
      data: {
        number: pn.number,
        formatted: pn.formatted,
        countryCode: pn.countryCode || '+1',
        areaCode: pn.areaCode,
        numberType: pn.numberType,
        vanityText: pn.vanityText,
        basePrice: pn.basePrice,
        isVanity: pn.isVanity || false,
        isPremium: pn.isPremium || false,
        pattern: pn.pattern,
        stateName: pn.stateName,
        cityName: pn.cityName,
        searchText: pn.searchText,
        status: 'available',
      },
    });
    phoneNumbers.push(created);
  }

  console.log(`   ✅ Created ${phoneNumbers.length} phone numbers`);

  // ─── 4. Listings ───
  console.log('📋 Creating listings...');

  // Give some numbers to sellers
  const sellerNumbers = phoneNumbers.filter(pn => pn.isPremium || pn.isVanity);
  const listingsData = [];

  for (let i = 0; i < Math.min(12, sellerNumbers.length); i++) {
    const seller = i % 2 === 0 ? seller1 : seller2;
    const pn = sellerNumbers[i];
    await prisma.phoneNumber.update({
      where: { id: pn.id },
      data: { ownerId: seller.id, source: 'broker' },
    });

    const listingType = pn.numberType === 'toll_free' ? 'license' : 'both';
    const listing = await prisma.listing.create({
      data: {
        phoneNumberId: pn.id,
        sellerId: seller.id,
        listingType,
        salePrice: listingType !== 'license' ? pn.basePrice : null,
        licensePrice: listingType !== 'sale' ? Number(pn.basePrice) * 0.05 : null, // 5% monthly license
        minimumOffer: Number(pn.basePrice) * 0.5,
        allowOffers: true,
        viewsCount: Math.floor(Math.random() * 200) + 10,
        offersCount: Math.floor(Math.random() * 5),
      },
    });
    listingsData.push(listing);
  }

  console.log(`   ✅ Created ${listingsData.length} listings`);

  // ─── 5. Offers ───
  console.log('💬 Creating sample offers...');

  if (listingsData.length >= 3) {
    await prisma.offer.create({
      data: {
        listingId: listingsData[0].id, phoneNumberId: listingsData[0].phoneNumberId,
        buyerId: buyer1.id, sellerId: seller1.id, offerType: 'buy',
        amount: Number(listingsData[0].salePrice || 0) * 0.7,
        buyerMessage: 'Very interested in this number for my business. Would you accept this offer?',
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await prisma.offer.create({
      data: {
        listingId: listingsData[1].id, phoneNumberId: listingsData[1].phoneNumberId,
        buyerId: buyer2.id, sellerId: seller2.id, offerType: 'buy',
        amount: Number(listingsData[1].salePrice || 0) * 0.8,
        buyerMessage: 'This would be perfect for our marketing campaign.',
        status: 'accepted', respondedAt: new Date(),
      },
    });

    await prisma.offer.create({
      data: {
        listingId: listingsData[2].id, phoneNumberId: listingsData[2].phoneNumberId,
        buyerId: buyer3.id, sellerId: seller1.id, offerType: 'buy',
        amount: Number(listingsData[2].salePrice || 0) * 0.4,
        buyerMessage: 'Starting a new business and looking for a good number.',
        status: 'declined', sellerResponse: 'Thank you for your offer, but the price is too low.',
        respondedAt: new Date(),
      },
    });

    await prisma.offer.create({
      data: {
        listingId: listingsData[0].id, phoneNumberId: listingsData[0].phoneNumberId,
        buyerId: buyer2.id, sellerId: seller1.id, offerType: 'license',
        amount: 25.00,
        buyerMessage: 'Would love to license this number monthly.',
        status: 'countered', counterAmount: 35.00,
        sellerResponse: 'I can do $35/month for licensing.',
        respondedAt: new Date(),
      },
    });
  }

  // ─── 6. Sample Orders ───
  console.log('🛒 Creating sample orders...');

  const availableNumber = phoneNumbers.find(pn => !pn.isPremium && !pn.isVanity && pn.numberType === 'local');
  if (availableNumber) {
    const order = await prisma.order.create({
      data: {
        orderNumber: 'NDP-2026-00001',
        buyerId: buyer1.id,
        subtotal: Number(availableNumber.basePrice) + 5.00,
        fusfFee: 1.50,
        totalAmount: Number(availableNumber.basePrice) + 6.50,
        status: 'completed',
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        orderItems: {
          create: {
            phoneNumberId: availableNumber.id,
            itemType: 'purchase', planType: 'park',
            price: availableNumber.basePrice,
            setupFee: 5.00, monthlyFee: 2.99,
          },
        },
      },
    });

    // Mark number as sold
    await prisma.phoneNumber.update({
      where: { id: availableNumber.id },
      data: { status: 'sold', ownerId: buyer1.id },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id, userId: buyer1.id,
        amount: order.totalAmount, paymentMethod: 'card',
        stripePaymentId: 'pi_mock_seed_001', status: 'succeeded',
      },
    });

    await prisma.subscription.create({
      data: {
        userId: buyer1.id, phoneNumberId: availableNumber.id,
        planType: 'park', monthlyAmount: 2.99, status: 'active',
        currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ─── 7. FAQs ───
  console.log('❓ Creating FAQs...');

  const faqsData = [
    { question: 'What is number parking?', answer: 'Number parking lets you store a phone number without a phone line. Your number stays active and safe while you decide what to do with it. Park plans start at just $2.99/month.', category: 'Services', sortOrder: 1 },
    { question: 'How do I port my number to NumberDepot?', answer: 'Porting is easy! Just provide your current carrier info, account number, and PIN. We handle the rest. Most ports complete within 1-3 business days. There is a one-time $5 porting fee.', category: 'Porting', sortOrder: 2 },
    { question: 'What is the difference between Park, Forward, and Unlimited plans?', answer: 'Park ($2.99/mo) stores your number safely. Forward ($6.99/mo) includes 600 minutes of call forwarding and voicemail. Unlimited ($19.99/mo) gives you unlimited calling, forwarding, and all features.', category: 'Pricing', sortOrder: 3 },
    { question: 'Can I sell my phone number?', answer: 'Yes! Apply to become a broker on our platform. Once approved, you can list your numbers for sale or license. We charge a 10% marketplace fee on each transaction.', category: 'Selling', sortOrder: 4 },
    { question: 'What is the marketplace fee?', answer: 'NumberDepot charges a 10% commission on marketplace sales. The seller keeps 90% of the sale price. Earnings are available for ACH payout after a 10-day hold period.', category: 'Selling', sortOrder: 5 },
    { question: 'How does Make an Offer work?', answer: 'Click "Make an Offer" on any eligible listing. Enter your offer amount and message. The seller has 24 hours to accept, decline, or counter. Your payment method is authorized (not charged) until the offer is resolved.', category: 'Buying', sortOrder: 6 },
    { question: 'Can I forward calls to a cell phone?', answer: 'Absolutely! With our Forward or Unlimited plan, you can forward calls to any US or Canadian phone number, including cell phones. You can also set up custom greetings and voicemail.', category: 'Services', sortOrder: 7 },
    { question: 'What is a vanity number?', answer: 'A vanity number spells a word or phrase on the phone keypad, like 1-800-FLOWERS. These numbers are highly memorable and great for businesses. Browse our vanity number inventory!', category: 'Numbers', sortOrder: 8 },
    { question: 'How do I cancel my service?', answer: 'You can cancel anytime with no contracts or cancellation fees. Go to your Account > Billing > Subscriptions and click Cancel. Your number will remain yours until the end of the billing period.', category: 'Account', sortOrder: 9 },
    { question: 'Do you offer toll-free numbers?', answer: 'Yes! We have a large inventory of toll-free numbers with 800, 888, 877, 866, 855, 844, and 833 prefixes. Note: Per FCC regulations, toll-free numbers can be licensed but not sold.', category: 'Numbers', sortOrder: 10 },
    { question: 'What payment methods do you accept?', answer: 'We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover). For purchases over $10,000, we can arrange wire transfers.', category: 'Billing', sortOrder: 11 },
    { question: 'Is my number secure?', answer: 'Absolutely. We use industry-standard security measures including SSL encryption, port-out protection PINs, and two-factor authentication to keep your numbers safe.', category: 'Security', sortOrder: 12 },
  ];

  for (const faq of faqsData) {
    await prisma.faq.create({ data: faq });
  }

  // ─── 8. Blog Posts ───
  console.log('📝 Creating blog posts...');

  await prisma.blogPost.create({
    data: {
      slug: 'why-you-need-a-vanity-phone-number',
      title: 'Why Your Business Needs a Vanity Phone Number in 2026',
      excerpt: 'Discover how vanity numbers can boost brand recognition, increase call volume, and give your business a professional edge.',
      content: `# Why Your Business Needs a Vanity Phone Number in 2026\n\nIn today's competitive marketplace, standing out is everything. A vanity phone number — one that spells a word or phrase — can be one of the most powerful branding tools in your arsenal.\n\n## What is a Vanity Number?\n\nA vanity number is a phone number that spells out a word using the letters on a phone keypad. For example, 1-800-FLOWERS or 1-800-CONTACTS.\n\n## Benefits\n\n- **Brand Recognition**: Customers remember words better than random digits\n- **Increased Call Volume**: Studies show vanity numbers can increase calls by up to 30%\n- **Professional Image**: Shows you're established and invested in your brand\n- **Marketing ROI**: Easy to use in ads, billboards, and radio spots\n\n## How to Get Started\n\nBrowse our inventory of thousands of vanity numbers, both local and toll-free. Find the perfect number for your business today!`,
      authorId: admin.id,
      status: 'published',
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      tags: ['vanity-numbers', 'business', 'branding', 'marketing'],
    },
  });

  await prisma.blogPost.create({
    data: {
      slug: 'complete-guide-to-phone-number-porting',
      title: 'The Complete Guide to Phone Number Porting',
      excerpt: 'Everything you need to know about transferring your phone number to a new carrier, including timelines, requirements, and common pitfalls.',
      content: `# The Complete Guide to Phone Number Porting\n\nPorting your phone number means transferring it from one carrier to another. Here's everything you need to know.\n\n## What You'll Need\n\n1. Your current carrier name\n2. Account number\n3. Account PIN or password\n4. Authorized name on the account\n5. Service address\n\n## Timeline\n\n- Simple ports: 1-3 business days\n- Complex ports: 5-10 business days\n\n## Common Issues\n\n- Account name mismatch\n- Outstanding balance\n- Wrong PIN\n\n## Tips for a Smooth Port\n\n- Don't cancel your current service first\n- Verify all information matches your current bill\n- Keep your old service active until the port completes`,
      authorId: admin.id,
      status: 'published',
      publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      tags: ['porting', 'guide', 'how-to', 'transfer'],
    },
  });

  await prisma.blogPost.create({
    data: {
      slug: 'toll-free-vs-local-which-is-right',
      title: 'Toll-Free vs Local Numbers: Which Is Right for Your Business?',
      excerpt: 'Comparing toll-free and local phone numbers to help you decide which option best suits your business needs.',
      content: `# Toll-Free vs Local Numbers\n\nChoosing between a toll-free and local number depends on your business type and goals.\n\n## Toll-Free Numbers\n- Professional, nationwide presence\n- Free for callers\n- Great for national businesses\n- 800, 888, 877, 866, 855, 844, 833 prefixes\n\n## Local Numbers\n- Establishes local presence\n- Area code recognition\n- Better for local businesses\n- Can be vanity numbers too\n\n## Our Recommendation\n\nMany businesses use both — a toll-free number for national marketing and a local number for community trust.`,
      authorId: admin.id,
      status: 'published',
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      tags: ['toll-free', 'local', 'business', 'comparison'],
    },
  });

  // ─── 9. Static Pages ───
  console.log('📄 Creating static pages...');

  await prisma.staticPage.create({
    data: {
      slug: 'about', title: 'About NumberDepot',
      content: 'NumberDepot is the premier marketplace for buying, selling, and managing phone numbers. We offer the largest inventory of local, toll-free, and vanity numbers at the lowest prices. Our mission is to make phone number management simple, affordable, and accessible to everyone.',
      metaDescription: 'Learn about NumberDepot - the largest marketplace for phone numbers with affordable pricing and expert support.',
    },
  });

  await prisma.staticPage.create({
    data: {
      slug: 'terms', title: 'Terms of Service',
      content: 'These Terms of Service govern your use of the NumberDepot platform. By accessing or using our services, you agree to be bound by these terms. NumberDepot reserves the right to modify these terms at any time.',
      metaDescription: 'NumberDepot Terms of Service - read our terms and conditions for using the platform.',
    },
  });

  await prisma.staticPage.create({
    data: {
      slug: 'privacy', title: 'Privacy Policy',
      content: 'NumberDepot is committed to protecting your privacy. This policy describes how we collect, use, and safeguard your personal information when you use our platform.',
      metaDescription: 'NumberDepot Privacy Policy - learn how we protect your personal information.',
    },
  });

  // ─── 10. Platform Settings ───
  console.log('⚙️ Creating platform settings...');

  const settings = [
    { key: 'platform_name', value: 'NumberDepot', description: 'Platform display name' },
    { key: 'commission_rate', value: '10', description: 'Marketplace commission percentage' },
    { key: 'first_sale_hold_days', value: '30', description: 'Hold period for first sale earnings' },
    { key: 'regular_hold_days', value: '10', description: 'Hold period for regular earnings' },
    { key: 'setup_fee', value: '5.00', description: 'One-time setup fee per number' },
    { key: 'park_monthly', value: '2.99', description: 'Park plan monthly price' },
    { key: 'forward_monthly', value: '6.99', description: 'Forward plan monthly price' },
    { key: 'unlimited_monthly', value: '19.99', description: 'Unlimited plan monthly price' },
    { key: 'business_monthly', value: '9.99', description: 'Business plan monthly price' },
    { key: 'min_payout', value: '25.00', description: 'Minimum payout amount' },
    { key: 'support_email', value: 'support@numberdepot.com', description: 'Support email address' },
    { key: 'maintenance_mode', value: 'false', description: 'Enable maintenance mode' },
  ];

  for (const setting of settings) {
    await prisma.platformSetting.create({ data: setting });
  }

  // ─── Notifications ───
  console.log('🔔 Creating sample notifications...');

  await prisma.notification.create({
    data: {
      userId: buyer1.id, type: 'order_completed',
      title: 'Order Confirmed', message: 'Your order NDP-2026-00001 has been completed. Your new number is ready!',
      data: { orderNumber: 'NDP-2026-00001' },
    },
  });

  await prisma.notification.create({
    data: {
      userId: seller1.id, type: 'offer_received',
      title: 'New Offer Received', message: 'You received a new offer on one of your listings.',
    },
  });

  console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║   🌱  Seed Complete!                          ║
║                                               ║
║   Users:           6                          ║
║   Phone Numbers:   ${String(phoneNumbers.length).padEnd(27)}║
║   Listings:        ${String(listingsData.length).padEnd(27)}║
║   FAQs:            ${String(faqsData.length).padEnd(27)}║
║   Blog Posts:      3                          ║
║                                               ║
║   Admin Login:                                ║
║   📧 admin@numberdepot.com                   ║
║   🔑 Admin123!                               ║
║                                               ║
║   Buyer Login:                                ║
║   📧 john.doe@email.com                      ║
║   🔑 User1234!                               ║
║                                               ║
║   Seller Login:                               ║
║   📧 mike.telecom@email.com                  ║
║   🔑 User1234!                               ║
║                                               ║
╚═══════════════════════════════════════════════╝
  `);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
