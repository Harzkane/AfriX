# AfriToken Agent Handbook

## Welcome to the AfriToken Agent Network!

Congratulations on becoming an AfriToken agent! This handbook will guide you through everything you need to know to succeed as an agent facilitating token exchanges for users.

---

## Table of Contents

1. [What is an Agent?](#what-is-an-agent)
2. [How the System Works](#how-the-system-works)
3. [Getting Started](#getting-started)
4. [Minting Process (User Buys Tokens)](#minting-process-user-buys-tokens)
5. [Burning Process (User Sells Tokens)](#burning-process-user-sells-tokens)
6. [Managing Your Capacity](#managing-your-capacity)
7. [Payment Methods](#payment-methods)
8. [Best Practices](#best-practices)
9. [Performance Metrics](#performance-metrics)
10. [Handling Disputes](#handling-disputes)
11. [Earnings & Fees](#earnings--fees)
12. [Troubleshooting](#troubleshooting)
13. [FAQs](#faqs)

---

## What is an Agent?

### Your Role

As an AfriToken agent, you are an **independent contractor** who facilitates the exchange between digital tokens (NT/CT) and fiat currency (Naira/XOF). You are NOT an employee of AfriToken.

### What You Do

**Minting (User Buying)**:

- User sends you Naira/XOF via bank or mobile money
- You verify payment in your account
- You mint digital tokens to their wallet

**Burning (User Selling)**:

- User sends tokens to escrow (protected)
- You send Naira/XOF to their account
- System burns the tokens
- Your minting capacity increases

### What You're NOT

- ❌ You are NOT a bank
- ❌ You are NOT processing payments
- ❌ You are NOT holding user funds
- ✅ You ARE facilitating token-fiat exchanges
- ✅ You ARE an independent service provider

---

## How the System Works

### The Big Picture

```
User wants tokens → Sends you Naira → You mint tokens to them
User wants Naira → Sends tokens to escrow → You send Naira → Tokens burned
```

### Your Security Deposit

- You deposit USDT (cryptocurrency) as security
- Your minting capacity = Your deposit amount
- When you mint tokens: Capacity decreases
- When you burn tokens: Capacity increases
- If you violate rules: Deposit gets slashed

**Example**:

```
You deposit: $10,000 USDT
Available capacity: $10,000

User A buys 5,000 NT from you
Your capacity: $5,000 remaining

User B sells 2,000 NT to you
Your capacity: $7,000 available
```

### Escrow Protection

When users sell tokens to you:

1. Their tokens lock in smart contract (they can't access)
2. You send fiat to their account
3. You confirm "fiat sent" → tokens burn automatically
4. User has 30 minutes to confirm or dispute
5. If dispute: Your deposit gets slashed, user gets refund

**This protects users from agents who don't deliver.**

---

## Getting Started

### Step 1: Application Approval ✅

You've already completed this! Your application was reviewed and approved.

### Step 2: Deposit USDT

**Minimum**: $5,000 USDT (or platform minimum, e.g. $100 to activate)  
**Recommended**: $10,000+ USDT (more capacity = more business)

**How to Deposit** (submit tx_hash — backend verifies on-chain):

1. Open Agent Dashboard in app
2. Tap "Increase Capacity" / "Deposit"
3. See the platform **deposit address** (treasury) and QR code
4. Send USDT (ERC-20 on **Polygon**) from your wallet to that address
5. After the transaction confirms, **submit the transaction hash and amount** in the app (e.g. "I've sent USDT" → enter amount and tx hash)
6. The **platform verifies the transaction on the blockchain** and then credits your capacity

**Important**: Only send USDT on Polygon network! Sending wrong token or wrong network = lost funds. Deposits are **not** auto-detected; you must submit the tx hash (and amount) so the backend can verify and credit you. Automatic on-chain detection may be added in the future.

### Step 3: Complete Training

- Watch training videos (15 minutes)
- Read this handbook
- Take the quiz (must score 8/10)
- Practice with test transactions

### Step 4: Activate Your Profile

Once deposit confirmed and training complete:

- Your status changes to "Active"
- You appear in user matching
- You can accept requests

---

## Minting Process (User Buys Tokens)

### Step-by-Step: User Wants to Buy 10,000 NT

**1. You Receive Notification**

```
🔔 New Token Request
User: John Doe
Amount: 10,000 NT (≈₦10,000)
Expires in: 30 minutes
[View Details]
```

**2. Check Request Details**

- User name and email
- Amount requested
- Payment proof (screenshot)
- Transaction reference number

**3. Verify Payment in Your Account**

**Critical**: Check YOUR actual bank/mobile money account!

✅ **Good verification**:

- Open your GTBank app
- See ₦10,000 credit
- Reference matches user's screenshot
- Account name matches

❌ **Bad verification**:

- Just looking at screenshot without checking
- Accepting fake/edited screenshots
- Not verifying reference number

**4. Confirm Payment Received**

Once verified in YOUR account:

- Tap "Confirm Payment Received"
- System automatically mints 10,000 NT to user
- User receives tokens instantly
- Your capacity decreases by 10,000

**5. Done!**

User gets notification: "✅ 10,000 NT received!"  
You earn your fee

### What If Payment Looks Wrong?

**Tap "Payment Not Received" and explain**:

- Screenshot doesn't match amount
- Wrong reference number
- Payment to wrong account
- Edited/fake screenshot

System creates dispute → Admin reviews → Decision made

### Response Time Target

⏱️ **Respond within 15 minutes** (average: 5 minutes)

Why?

- Users are waiting
- Good experience = good ratings
- Slow response = lower ranking = less business

---

## Burning Process (User Sells Tokens)

### Step-by-Step: User Wants to Sell 10,000 NT for ₦10,000

**1. You Receive Notification**

```
🔥 Burn Request
User: Jane Doe
Selling: 10,000 NT
You'll send: ₦10,000 to her account
Expires in: 30 minutes
[View Details]
```

**2. Check Request Details**

- User information
- Amount: 10,000 NT
- User's payment details:
  - Bank: GTBank
  - Account: 0987654321
  - Name: Jane Doe

**Important**: Tokens are in escrow. User can't access them. You're protected!

**3. Send Fiat to User**

Open your bank/mobile money app:

- Send ₦10,000 to Jane's account
- **Verify account number carefully!**
- Take screenshot of confirmation
- Note transaction reference

**4. Confirm in App**

- Tap "I've Sent the Money"
- Upload screenshot of transfer
- Enter transaction reference
- Tap "Submit"

**What Happens**:

- System burns the 10,000 NT from escrow
- Your minting capacity increases by 10,000
- User gets notification to confirm

**5. User Confirms (30-Minute Window)**

User checks their account:

- Sees ₦10,000 received
- Taps "Yes, I Received It"
- Transaction complete!

### What If User Doesn't Respond?

After 30 minutes of no response:

- System auto-escalates to admin
- Admin reviews your payment proof
- If valid: Transaction confirmed, you keep capacity
- If questionable: Admin investigates further

### What If User Disputes?

User taps "No, I Didn't Receive It":

**If you actually sent payment**:

- Admin reviews evidence from both sides
- Your bank statement vs their bank statement
- If you're right: Dispute dismissed, you're cleared
- Keep your payment proof safe!

**If you sent wrong amount or wrong account**:

- Admin verifies the error
- Your deposit gets slashed (120% of amount)
- User gets refund
- You get warning or suspension

### Critical Rules for Burning

✅ **Always Do**:

- Double-check account numbers
- Send exact amount requested
- Upload clear payment proof
- Send within time window

❌ **Never Do**:

- Send less than requested
- Send to wrong account
- Upload fake proof
- Delay payment hoping user forgets

---

## Managing Your Capacity

### Understanding Capacity

Your **minting capacity** is how many tokens you can mint at any given time.

**Formula**:

```
Current Capacity = Deposit - Currently Minted + Already Burned
```

**Example Timeline**:

```
Day 1: Deposit $10,000
Capacity: $10,000

Day 1: Mint 3,000 NT to User A
Capacity: $7,000 (decreased)

Day 2: Mint 4,000 NT to User B
Capacity: $3,000 (decreased)

Day 3: User C burns 2,000 NT
Capacity: $5,000 (increased)

Day 4: User A burns 3,000 NT
Capacity: $8,000 (increased)
```

### When You Need More Capacity

**Signs you need more**:

- Frequently hitting capacity limit
- Rejecting user requests
- Missing business opportunities

**How to increase**:

1. Go to Agent Dashboard
2. Tap "Increase Capacity"
3. Send additional USDT
4. Wait for confirmation
5. New capacity available!

**No limit on how much you can deposit.**

### Monitoring Your Capacity

Check daily:

- **Available capacity**: Can mint now
- **Pending transactions**: Temporarily reserved
- **Total minted**: Lifetime minting
- **Total burned**: Lifetime burning

---

## Payment Methods

### What You Need

**Nigeria**:

- Bank account (GTBank, Access, UBA, etc.)
- Mobile money account (Opay, PalmPay, Moniepoint)
- Fast internet access
- Reliable smartphone

**XOF Countries**:

- Bank account (local banks)
- Mobile money (Orange Money, MTN Mobile Money)
- Reliable smartphone
- Internet connection

### Setting Up Payment Methods

In your agent profile:

**Bank Transfer**:

- Bank name: GTBank
- Account number: 0123456789
- Account name: Your Name

**Mobile Money**:

- Provider: Opay
- Number: 08012345678
- Name: Your Name

Users see these details when buying from you.

### Payment Method Best Practices

✅ **Do**:

- Use accounts in your name
- Keep accounts active and funded
- Check accounts multiple times daily
- Enable SMS/email notifications

❌ **Don't**:

- Use someone else's account
- Use business names that don't match your profile
- Let accounts run empty (can't send for burns)
- Ignore payment notifications

---

## Best Practices

### Response Times

**Target: <10 minutes average**

| Response Time | Impact                             |
| ------------- | ---------------------------------- |
| 0-5 minutes   | ⭐⭐⭐⭐⭐ Excellent - Top ranking |
| 5-10 minutes  | ⭐⭐⭐⭐ Good - High visibility    |
| 10-15 minutes | ⭐⭐⭐ Acceptable - Standard       |
| 15-20 minutes | ⭐⭐ Poor - Lower ranking          |
| >20 minutes   | ⭐ Bad - Hidden from users         |

**Tips to respond faster**:

- Enable push notifications
- Check app every hour
- Set up SMS alerts
- Use app's quick reply features

### Customer Service

**Be Professional**:

- Polite and respectful
- Quick responses
- Clear communication
- Patient with questions

**Example Good Response**:

```
"Hello! I've received your payment of ₦10,000.
Your tokens will be minted in the next minute.
Thank you for using my service! 😊"
```

**Example Bad Response**:

```
"Ok"
```

### Accuracy is Critical

**Double-check everything**:

- Account numbers
- Payment amounts
- Reference numbers
- Token amounts

**One mistake can**:

- Create dispute
- Slash your deposit
- Lower your rating
- Get you suspended

### Availability

**Set realistic service hours**:

- If 24/7: Be ready to respond anytime
- If business hours: Set clear schedule
- Use "Go Offline" when unavailable
- Update status before going offline

**Users only see you when you're "Active" and available.**

### Building Your Reputation

**5-star ratings come from**:

- Fast responses
- Accurate transactions
- Friendly service
- Professional conduct
- Reliability

**How to maintain 4.5+ rating**:

- Never miss a request
- Always verify carefully
- Communicate clearly
- Resolve issues quickly
- Go extra mile for users

---

## Performance Metrics

### What Gets Measured

**Dashboard shows**:

1. **Average Response Time**: How fast you respond
2. **Completion Rate**: % of accepted requests completed
3. **User Rating**: Average rating from users (0-5 stars)
4. **Total Transactions**: Lifetime transaction count
5. **This Week/Month Stats**: Recent performance

### Performance Tiers

**Platinum Agent** (Top 10%):

- Response time: <5 minutes
- Completion rate: >98%
- Rating: >4.8/5
- Benefits: Featured placement, higher fee share

**Gold Agent** (Top 25%):

- Response time: <10 minutes
- Completion rate: >95%
- Rating: >4.5/5
- Benefits: Priority placement, standard fees

**Silver Agent** (Standard):

- Response time: <15 minutes
- Completion rate: >90%
- Rating: >4.0/5
- Benefits: Normal visibility

**Probation** (Needs Improvement):

- Response time: >15 minutes
- Completion rate: <90%
- Rating: <4.0/5
- Consequences: Limited visibility, review in 30 days

### What Happens on Probation

**30-Day Review Period**:

- Limited to 5 transactions per day
- Not shown to new users
- Only existing users can find you
- Admin monitors performance

**Outcomes**:

- Improve: Return to active status
- No improvement: Suspension
- Violations during probation: Immediate termination

---

## Handling Disputes

### Why Disputes Happen

**Common reasons**:

1. Agent didn't send fiat (or sent wrong amount)
2. Agent sent to wrong account
3. User lying (trying to get free tokens)
4. Miscommunication
5. Payment delays

### When User Disputes

**You'll receive**:

```
⚠️ Dispute Filed
Transaction: #BRN12345
User claims: "No payment received"
Deadline: Submit evidence in 24 hours
[View Dispute]
```

### How to Respond

**Within 24 hours, submit**:

1. Screenshot of your bank transfer
2. Transaction reference number
3. Timestamp showing when sent
4. Your explanation of what happened

**Example good response**:

```
"I sent ₦10,000 via GTBank on Oct 22 at 2:30 PM.
Reference: TRF202510220001
Screenshot attached showing successful transfer.
User's account: 0987654321 - Jane Doe
Amount matches exactly."
```

### Admin Reviews

Admin checks:

- Your payment proof
- User's bank statement
- Account numbers match
- Amounts match
- Timestamps match

**Possible outcomes**:

1. **You win**: Dispute dismissed, capacity restored
2. **User wins**: Your deposit slashed, user refunded
3. **Partial**: You sent wrong amount, partial penalty
4. **Unclear**: Both provide more evidence

### Preventing Disputes

✅ **Best practices**:

- Always screenshot transfers
- Save all transaction references
- Verify account numbers twice
- Send exact amounts
- Upload clear payment proof immediately

❌ **What causes disputes**:

- Sending to wrong account
- Sending wrong amount
- No payment proof
- Delayed payments
- Poor communication

### If You're Right

**You have proof, user is lying**:

- Admin will see your evidence
- Dispute resolved in your favor
- User gets flagged for fraud
- Your reputation protected
- Deposit intact

**Keep all evidence for 90 days!**

---

## Earnings & Fees

### How You Earn

**1. Platform Fee Share**:

- Users pay 1% fee on agent transactions
- You keep 0.5%
- Platform keeps 0.5%

**Example**:

```
User buys 10,000 NT
Fee: 100 NT (1%)
You earn: 50 NT
Platform gets: 50 NT
```

**2. Spread (Optional)**:

- You can set your own rates (within limits)
- Buy NT at 0.99 Naira, sell at 1.01 Naira
- Keep the difference
- Must stay within ±2% of reference rate

**3. Volume Bonuses**:

- Bronze: 100+ transactions/month = extra 0.1%
- Silver: 500+ transactions/month = extra 0.2%
- Gold: 1000+ transactions/month = extra 0.3%

### Example Monthly Earnings

**Conservative (New Agent)**:

- 50 transactions/month
- Average: 5,000 NT per transaction
- Total volume: 250,000 NT
- Fee earnings (0.5%): 1,250 NT
- Estimated: ₦1,250/month

**Moderate (Established Agent)**:

- 200 transactions/month
- Average: 8,000 NT per transaction
- Total volume: 1,600,000 NT
- Fee earnings (0.5%): 8,000 NT
- Volume bonus: +0.1%
- Estimated: ₦9,600/month

**Active (Top Agent)**:

- 1000 transactions/month
- Average: 10,000 NT per transaction
- Total volume: 10,000,000 NT
- Fee earnings (0.5%): 50,000 NT
- Volume bonus: +0.3%
- Spread earnings: +5,000 NT
- Estimated: ₦80,000/month

### Withdrawing Earnings

**How it works**:

- Earnings accumulate in your agent wallet
- Minimum withdrawal: 1,000 NT (₦1,000)
- Withdraw to your registered bank account
- Processing time: Instant
- No withdrawal fees

**To withdraw**:

1. Agent Dashboard → "Withdraw Earnings"
2. Enter amount
3. Confirm
4. Receive in your bank account

---

## Troubleshooting

### Common Issues & Solutions

**Issue: "Insufficient capacity"**

- **Cause**: You've minted too many tokens
- **Solution**: Wait for users to burn tokens, or add more deposit

**Issue: User says "I sent payment but you didn't confirm"**

- **Check**: Your bank account for the payment
- **If you see it**: Confirm immediately
- **If you don't**: Ask user for reference number, verify

**Issue: "Cannot send fiat, my account balance is low"**

- **Solution**: Keep sufficient balance for burning requests
- **Best practice**: Maintain balance of at least 50,000 NGN

**Issue: App says "Transaction expired"**

- **Cause**: You didn't respond within 30 minutes
- **Effect**: Request cancelled, capacity refunded to you
- **Solution**: Respond faster next time

**Issue: User uploaded fake screenshot**

- **Action**: Tap "Payment Not Received"
- **Explain**: "Screenshot appears edited/fake"
- **Admin reviews**: Will investigate

**Issue: Sent to wrong account number**

- **Immediately**: Contact support
- **Provide**: Your transfer proof, correct account number
- **May need**: To resend to correct account
- **Your responsibility**: Always verify account numbers

### Technical Issues

**App not loading?**

- Check internet connection
- Restart app
- Clear cache
- Update to latest version

**Notifications not working?**

- Check notification settings
- Re-enable in phone settings
- Log out and log back in

**Can't upload proof?**

- Check file size (max 5MB)
- Use JPG or PNG format
- Check internet connection
- Try taking new photo

### Getting Help

**Support Channels**:

- In-app chat: Agent Support
- Email: agent-support@afritoken.com
- WhatsApp: +234 XXX XXX XXXX
- Telegram: @AfriTokenAgentSupport

**Response times**:

- Critical issues: 1 hour
- Urgent issues: 4 hours
- General questions: 24 hours

---

## FAQs

### General Questions

**Q: Am I employed by AfriToken?**
A: No, you're an independent contractor. You run your own business using our platform.

**Q: Do I need to register a business?**
A: Not required, but recommended for serious agents handling large volumes.

**Q: Can I have multiple agent accounts?**
A: No, one agent account per person.

**Q: Can I be an agent in multiple countries?**
A: Yes, if you can handle payment methods in both countries.

### Capacity & Deposits

**Q: What happens to my deposit if I stop being an agent?**
A: You can withdraw it after 30 days notice, once all tokens you minted are burned.

**Q: Can I withdraw part of my deposit?**
A: Only the portion not backing currently minted tokens.

**Q: Is my deposit insured?**
A: No, but it's held in smart contract, not by AfriToken directly.

**Q: What happens if users never burn the tokens I minted?**
A: That portion of your deposit stays locked. Encourage users to trade actively.

### Operations

**Q: Can I reject user requests?**
A: Yes, but it affects your completion rate. Only reject suspicious requests.

**Q: What if I need a break?**
A: Toggle your status to "Offline". You won't receive new requests.

**Q: Can I set my own hours?**
A: Yes, set service hours in your profile.

**Q: Do I have to accept all token types?**
A: No, you can choose to handle NT only, CT only, or both.

### Payments

**Q: What if user sends payment from different account name?**
A: Reject and ask them to send from matching account. Prevents fraud.

**Q: Can I use mobile money for everything?**
A: Yes, but offer bank transfer as backup option.

**Q: What if payment is delayed in bank?**
A: Explain to user, request extension if needed.

**Q: Can I charge extra fees?**
A: No, but you can set rates within ±2% of reference rate.

### Disputes

**Q: What if I'm falsely accused?**
A: Provide evidence to admin. If you're right, no penalty.

**Q: How many disputes before I'm suspended?**
A: 3 disputes against you in 30 days = automatic review.

**Q: What if user disputes after confirming?**
A: They cannot. Once confirmed, transaction is final.

**Q: Can I dispute a user?**
A: Yes, if user provided fake payment proof or is fraudulent.

### Performance

**Q: How do I become a Platinum agent?**
A: Maintain >4.8 rating, <5 min response time, >98% completion rate.

**Q: What happens if my rating drops below 4.0?**
A: 30-day probation with limited visibility.

**Q: Can I see my statistics history?**
A: Yes, Agent Dashboard shows all historical data.

**Q: Do I get penalized for being slow occasionally?**
A: No, we calculate averages. Consistent slow responses hurt you.

---

## Success Tips from Top Agents

### From "Lagos Express" (Platinum Agent)

> "I keep ₦200,000 in my account always. Fast payments = happy users = 5 stars. Also, I respond within 2 minutes every time. Users love fast service!"

### From "Ada's Exchange" (Gold Agent)

> "I take clear screenshots of every transfer and save them in Google Drive. Never had a dispute go against me because I have proof every time."

### From "Quick Trade NG" (Gold Agent)

> "Set realistic hours. I'm available 8am-8pm daily. Being consistent is better than being available randomly. Users know when to find me."

### From "Dakar Fast" (Silver Agent)

> "Learn your users. Regulars get priority. Build relationships. They'll keep coming back and rate you well."

---

## Important Reminders

### Legal & Tax

- You're responsible for your own taxes
- Keep records of all transactions
- Consult tax professional if needed
- You're NOT an AfriToken employee

### Security

- Never share your agent login
- Use strong passwords
- Enable 2FA if available
- Keep your deposit wallet secure
- Don't click suspicious links

### Prohibited Activities

❌ **You will be terminated for**:

- Fraud or attempted fraud
- Sending fake payment proofs
- Not delivering fiat after burning tokens
- Harassing users
- Multiple disputes confirmed against you
- Using someone else's account
- Money laundering
- Any illegal activities

### Platform Rights

AfriToken reserves the right to:

- Suspend or terminate agents
- Adjust fee structures
- Update policies
- Request additional verification
- Slash deposits for violations

---

## Next Steps

### Your First Week Checklist

**Day 1**:

- ✅ Complete training
- ✅ Set up payment methods
- ✅ Test with small transactions
- ✅ Get familiar with dashboard

**Day 2-3**:

- ✅ Accept first 5 real requests
- ✅ Focus on fast response times
- ✅ Ask for user feedback
- ✅ Review your performance

**Day 4-7**:

- ✅ Increase transaction volume
- ✅ Maintain 100% accuracy
- ✅ Build your rating
- ✅ Optimize your processes

### Setting Goals

**Month 1**:

- Complete 50 transactions
- Achieve 4.5+ rating
- <10 minute response time
- Zero disputes

**Month 2**:

- Complete 150 transactions
- Achieve 4.7+ rating
- <7 minute response time
- Build regular customers

**Month 3**:

- Complete 300+ transactions
- Achieve 4.8+ rating
- <5 minute response time
- Reach Gold tier

---

## Contact & Support

### Agent Support Team

**Email**: agent-support@afritoken.com  
**WhatsApp**: +234 XXX XXX XXXX  
**Telegram**: @AfriTokenAgents  
**Hours**: 24/7 for critical issues

### Agent Community

Join our agent community:

- Share tips and best practices
- Get peer support
- Stay updated on platform changes
- Network with other agents

**Telegram Group**: @AfriTokenAgentCommunity

---

## Conclusion

Thank you for joining the AfriToken agent network! Your role is critical to our platform's success. By providing fast, reliable, professional service, you help users access digital tokens seamlessly while building a sustainable business for yourself.

**Remember**:

- Speed matters
- Accuracy is critical
- Communication builds trust
- Evidence protects you
- Professionalism pays

**Welcome to the team! Let's build Africa's future of value exchange together! 🚀**

---

**Handbook Version**: 1.0  
**Last Updated**: October 22, 2025  
**Next Update**: Monthly or as needed

For the latest version, always check the Agent Dashboard → Resources → Agent Handbook
