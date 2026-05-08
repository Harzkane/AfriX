// node test_webhook.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const crypto = require('crypto');

// Map models and service
const { Merchant } = require('./src/models');
const { emitMerchantWebhook } = require('./src/services/merchantWebhookService');

const app = express();
// Keep raw body for exact signature matching
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.post('/mock-webhook', (req, res) => {
  console.log('\n=============================================');
  console.log('🔔 WEBHOOK RECEIVED ON MOCK SERVER');
  console.log('=============================================');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  // Verify signature
  const signatureHeader = req.headers['x-afriexchange-signature'];
  const timestampHeader = req.headers['x-afriexchange-timestamp'];

  // The exact logic a merchant would use to verify:
  if (req.merchantSecret) {
    const computedSignature = crypto
      .createHmac('sha256', req.merchantSecret)
      .update(`${timestampHeader}.${req.rawBody}`)
      .digest('hex');

    const isValid = signatureHeader === `sha256=${computedSignature}`;
    console.log(`\nSignature Verification: ${isValid ? '✅ PASSED' : '❌ FAILED'}`);
  }

  res.status(200).json({ received: true });
});

let server;

async function runTest() {
  server = app.listen(9999, async () => {
    console.log('🚀 Mock webhook server listening on port 9999...');

    try {
      // 1. Find a test merchant
      const merchant = await Merchant.findOne();
      if (!merchant) {
        console.error('❌ No merchants found in DB. Please create one first.');
        process.exit(1);
      }

      console.log(`\n👨‍💼 Using Merchant: ${merchant.business_name} (ID: ${merchant.id})`);

      // 2. Temporarily set their webhook URL to our mock server
      const originalUrl = merchant.webhook_url;
      await merchant.update({ webhook_url: 'http://localhost:9999/mock-webhook' });
      console.log(`🔗 Webhook URL set to: http://localhost:9999/mock-webhook`);

      // 3. Fire a mock 'collection.completed' webhook
      console.log(`\n📤 Dispatching webhook via emitMerchantWebhook()...`);
      await emitMerchantWebhook(merchant.id, {
        event: 'collection.completed',
        eventId: `afrix-collection-TEST-${Date.now()}`,
        data: {
          transaction_id: `tx-test-${Date.now()}`,
          amount: 50.00,
          token_type: 'CT',
          status: 'completed'
        }
      });

      // 4. Wait 1.5 seconds for the async delivery and DB update to finish
      setTimeout(async () => {
        // 5. Check the merchant's integration_health field
        const updatedMerchant = await Merchant.findByPk(merchant.id);

        console.log('\n=============================================');
        console.log('🩺 MERCHANT INTEGRATION HEALTH (DB RECORD)');
        console.log('=============================================');
        console.log(JSON.stringify(updatedMerchant.integration_health, null, 2));

        // 6. Restore original state
        await updatedMerchant.update({ webhook_url: originalUrl });
        console.log(`\n🧹 Cleanup: Restored original webhook URL`);

        console.log('\n✨ Test Complete!');
        server.close();
        process.exit(0);
      }, 1500);

    } catch (err) {
      console.error('\n❌ Test failed:', err);
      server.close();
      process.exit(1);
    }
  });
}

// Inject secret into req for verification in the express handler
app.use(async (req, res, next) => {
  const merchant = await Merchant.findOne({ where: { webhook_url: 'http://localhost:9999/mock-webhook' } });
  if (merchant) {
    req.merchantSecret = merchant.webhook_secret;
  }
  next();
});

runTest();
