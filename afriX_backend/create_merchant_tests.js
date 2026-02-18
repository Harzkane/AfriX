// create_merchant_tests.js
const { User, Merchant, MerchantKyc } = require("./src/models");
const { v4: uuidv4 } = require("uuid");

async function createMerchantTests() {
    try {
        console.log("Creating merchant management test data...");

        // 1. Pending Merchant (Needs Review)
        console.log("Creating Pending Merchant...");
        const user1 = await User.create({
            full_name: "Startup CEO",
            email: `ceo_${Date.now()}@example.com`,
            password: "Password123!",
            role: "merchant",
            is_email_verified: true
        });
        const merchant1 = await Merchant.create({
            user_id: user1.id,
            business_name: "AfriPay Solutions",
            business_email: `info@afripay_${Date.now()}.com`,
            business_phone: "+2348001234567",
            verification_status: "pending"
        });
        await MerchantKyc.create({
            merchant_id: merchant1.id,
            status: "pending",
            registration_number: "RC123456",
            tax_id: "TIN-987654321",
            document_url: "https://example.com/biz_reg.pdf",
            submitted_at: new Date()
        });

        // 2. Approved Merchant
        console.log("Creating Approved Merchant...");
        const user2 = await User.create({
            full_name: "Big Biz Owner",
            email: `owner_${Date.now()}@example.com`,
            password: "Password123!",
            role: "merchant",
            is_email_verified: true
        });
        const merchant2 = await Merchant.create({
            user_id: user2.id,
            business_name: "Global Trade Ltd",
            business_email: `contact@globaltrade_${Date.now()}.com`,
            business_phone: "+2348009998887",
            verification_status: "approved"
        });
        await MerchantKyc.create({
            merchant_id: merchant2.id,
            status: "approved",
            registration_number: "RC999888",
            tax_id: "TIN-111222333",
            document_url: "https://example.com/certs.pdf",
            submitted_at: new Date(),
            reviewed_at: new Date()
        });

        console.log("✅ Merchant management seed data created successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to create merchant seed data:", err);
        process.exit(1);
    }
}

createMerchantTests();
