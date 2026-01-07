lemme show you my routes testing:

http://localhost:5001/api/v1/auth/login

{
"email": "admin@gmail.com",
"password": "Admin123"
}

{
"success": true,
"message": "Login successful",
"data": {
"user": {
"id": "d5986677-6d3c-4877-96d8-a1049fba32aa",
"email": "admin@gmail.com",
"full_name": "System Administrator",
"phone_number": null,
"country_code": "NG",
"role": "admin",
"email_verified": true,
"phone_verified": false,
"identity_verified": false,
"verification_level": 1,
"education_what_are_tokens": false,
"education_how_agents_work": false,
"education_understanding_value": false,
"education_safety_security": false,
"language": "en",
"theme": "nigeria",
"push_notifications_enabled": true,
"email_notifications_enabled": true,
"sms_notifications_enabled": false,
"two_factor_enabled": false,
"last_login_at": "2025-11-06T01:16:09.348Z",
"last_login_ip": "::1",
"login_attempts": 0,
"locked_until": null,
"is_active": true,
"is_suspended": false,
"suspension_reason": null,
"suspended_until": null,
"referral_code": "20285E4E",
"referred_by": null,
"created_at": "2025-10-24T02:28:32.341Z",
"updated_at": "2025-11-06T01:16:09.349Z"
},
"tokens": {
"access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1OTg2Njc3LTZkM2MtNDg3Ny05NmQ4LWExMDQ5ZmJhMzJhYSIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NjIzOTE3NjksImV4cCI6MTc2MjQ3ODE2OX0.Q8ZSRizoJ2WPWcj5yCH3ULO9R8Ko8VWZ68PCXFP4weI",
"refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1OTg2Njc3LTZkM2MtNDg3Ny05NmQ4LWExMDQ5ZmJhMzJhYSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzYyMzkxNzY5LCJleHAiOjE3NjQ5ODM3Njl9.bDNt9USdIWDySEAjZHcaQjyyLp9YpCmLu-u71W4kxn8",
"expires_in": "24h"
}
}
}

{
"email": "john@gmail.com",
"password": "Admin123"
}

{
"success": true,
"message": "Login successful",
"data": {
"user": {
"id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
"email": "john@gmail.com",
"full_name": "John Doe",
"phone_number": null,
"country_code": "NG",
"role": "user",
"email_verified": true,
"phone_verified": false,
"identity_verified": false,
"verification_level": 1,
"education_what_are_tokens": false,
"education_how_agents_work": false,
"education_understanding_value": false,
"education_safety_security": false,
"language": "en",
"theme": "nigeria",
"push_notifications_enabled": true,
"email_notifications_enabled": true,
"sms_notifications_enabled": false,
"two_factor_enabled": false,
"last_login_at": "2025-11-06T11:06:29.342Z",
"last_login_ip": "::1",
"login_attempts": 0,
"locked_until": null,
"is_active": true,
"is_suspended": false,
"suspension_reason": null,
"suspended_until": null,
"referral_code": "48A57A65",
"referred_by": null,
"created_at": "2025-10-24T00:14:49.360Z",
"updated_at": "2025-11-06T11:06:29.343Z"
},
"tokens": {
"access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImIyMGY1NmY3LTk0NzEtNDVjNi1iNTZhLTUxZDZlNTExNzIxNyIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NjI0MjcxODksImV4cCI6MTc2MjUxMzU4OX0.eW5oP9JjeKovWbDN4QrQt-yXglGbruFZ6De03SDOLLw",
"refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImIyMGY1NmY3LTk0NzEtNDVjNi1iNTZhLTUxZDZlNTExNzIxNyIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzYyNDI3MTg5LCJleHAiOjE3NjUwMTkxODl9.e6ixQUTDVz-RGDX_FlwNbTOvdUC9WWV0_qJ9TewgMRM",
"expires_in": "24h"
}
}
}

http://localhost:5001/api/v1/agents/register

{
"country": "NG",
"currency": "NGN",
"withdrawal_address": "0x5d0d0e728e6656A279707262e403Ca2f2C2AA746"
}

{
"success": true,
"message": "Agent registered successfully. Please deposit USDT to activate.",
"data": {
"id": "2553aa20-748f-4609-9b03-c6a3ed025826",
"tier": "starter",
"status": "pending",
"withdrawal_address": "0x5d0d0e728e6656a279707262e403ca2f2c2aa746",
"deposit_instructions": {
"send_usdt_to": "0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e",
"network": "Polygon",
"minimum_deposit": 100
}
}
}

http://localhost:5001/api/v1/agents/deposit-address

{
"success": true,
"data": {
"address": "0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e",
"network": "Polygon",
"token": "USDT",
"qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e",
"instructions": [
"1. Send USDT on Polygon network to the address above",
"2. Copy your transaction hash after sending",
"3. Submit the transaction hash using /deposit endpoint",
"4. Wait for blockchain confirmation (usually 1-2 minutes)",
"5. Your capacity will be updated automatically"
],
"minimum_deposit": 100,
"notes": [
"⚠️ Only send USDT on Polygon network",
"⚠️ Do not send tokens from exchanges directly",
"⚠️ Make sure you have MATIC for gas fees"
]
}
}

http://localhost:5001/api/v1/agents/deposit

{
"amount_usd": 150,
"tx_hash": "0xed6fa71b0d36ba6647c73d8e9983cebd1d4ecaafa8fa444bbe4628efd1f62e07"
}

{
"success": true,
"message": "Deposit verified successfully!",
"data": {
"agent": {
"id": "2553aa20-748f-4609-9b03-c6a3ed025826",
"status": "active",
"deposit_usd": 150,
"available_capacity": 150
},
"transaction": {
"created_at": "2025-11-06T01:09:38.133Z",
"updated_at": "2025-11-06T01:09:38.133Z",
"id": "36a3cafd-93e8-4bf8-8520-60be51019d3b",
"fee": "0.00000000",
"reference": "TRX-20251106-636820F6",
"type": "agent_deposit",
"status": "completed",
"amount": "150.00000000",
"token_type": "USDT",
"description": "Agent deposit verified on Polygon",
"to_user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
"agent_id": "2553aa20-748f-4609-9b03-c6a3ed025826",
"metadata": {
"tx_hash": "0xed6fa71b0d36ba6647c73d8e9983cebd1d4ecaafa8fa444bbe4628efd1f62e07",
"from_address": "0x5d0d0e728e6656A279707262e403Ca2f2C2AA746",
"block_number": 28665286,
"treasury_address": "0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e"
},
"from_user_id": null,
"merchant_id": null,
"from_wallet_id": null,
"to_wallet_id": null,
"network": null,
"tx_hash": null,
"block_number": null,
"gas_fee": null,
"processed_at": null
}
}
}

http://localhost:5001/api/v1/agents/dashboard

{
"success": true,
"data": {
"agent": {
"id": "2553aa20-748f-4609-9b03-c6a3ed025826",
"status": "active",
"tier": "starter",
"rating": 5
},
"financials": {
"total_deposit": 150,
"available_capacity": 150,
"total_minted": 0,
"total_burned": 0,
"outstanding_tokens": 0,
"max_withdrawable": 150,
"utilization_rate": "0.00%"
},
"recent_transactions": [
{
"id": "36a3cafd-93e8-4bf8-8520-60be51019d3b",
"reference": "TRX-20251106-636820F6",
"type": "agent_deposit",
"status": "completed",
"amount": "150.00000000",
"fee": "0.00000000",
"token_type": "USDT",
"description": "Agent deposit verified on Polygon",
"metadata": {
"tx_hash": "0xed6fa71b0d36ba6647c73d8e9983cebd1d4ecaafa8fa444bbe4628efd1f62e07",
"from_address": "0x5d0d0e728e6656A279707262e403Ca2f2C2AA746",
"block_number": 28665286,
"treasury_address": "0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e"
},
"from_user_id": null,
"to_user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
"merchant_id": null,
"agent_id": "2553aa20-748f-4609-9b03-c6a3ed025826",
"from_wallet_id": null,
"to_wallet_id": null,
"network": null,
"tx_hash": null,
"block_number": null,
"gas_fee": null,
"processed_at": null,
"created_at": "2025-11-06T01:09:38.133Z",
"updated_at": "2025-11-06T01:09:38.133Z"
}
]
}
}

http://localhost:5001/api/v1/agents/withdraw-request

{
"amount_usd": 50
}

{
"success": true,
"message": "Withdrawal request submitted for approval",
"data": {
"request": {
"id": "16393387-1aff-4823-a62a-a37a782d6aef",
"agent_id": "2553aa20-748f-4609-9b03-c6a3ed025826",
"amount_usd": "50.00",
"status": "pending",
"updated_at": "2025-11-06T01:14:05.718Z",
"created_at": "2025-11-06T01:14:05.718Z",
"admin_notes": null,
"paid_tx_hash": null,
"paid_at": null
},
"max_withdrawable": 150,
"outstanding_tokens": 0,
"estimated_processing": "1-3 business days"
}
}

http://localhost:5001/api/v1/admin/withdrawals/pending

{
"success": true,
"data": [
{
"id": "16393387-1aff-4823-a62a-a37a782d6aef",
"agent_id": "2553aa20-748f-4609-9b03-c6a3ed025826",
"amount_usd": "50.00",
"status": "pending",
"admin_notes": null,
"paid_tx_hash": null,
"paid_at": null,
"created_at": "2025-11-06T01:14:05.718Z",
"updated_at": "2025-11-06T01:14:05.718Z",
"agent": {
"id": "2553aa20-748f-4609-9b03-c6a3ed025826",
"user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
"withdrawal_address": "0x5d0d0e728e6656a279707262e403ca2f2c2aa746",
"deposit_usd": 150,
"total_minted": 0,
"total_burned": 0
},
"outstanding_tokens": 0,
"max_withdrawable": 150,
"is_safe": true
}
]
}

http://localhost:5001/api/v1/admin/withdrawals/approve

{
"request_id": "16393387-1aff-4823-a62a-a37a782d6aef"
}

{
"success": true,
"data": {
"id": "16393387-1aff-4823-a62a-a37a782d6aef",
"agent_id": "2553aa20-748f-4609-9b03-c6a3ed025826",
"amount_usd": "50.00",
"status": "approved",
"admin_notes": null,
"paid_tx_hash": null,
"paid_at": null,
"created_at": "2025-11-06T01:14:05.718Z",
"updated_at": "2025-11-06T01:20:02.248Z",
"agent": {
"id": "2553aa20-748f-4609-9b03-c6a3ed025826",
"user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
"country": "NG",
"currency": "NGN",
"tier": "starter",
"status": "active",
"withdrawal_address": "0x5d0d0e728e6656a279707262e403ca2f2c2aa746",
"deposit_usd": 150,
"available_capacity": 150,
"total_minted": 0,
"total_burned": 0,
"rating": 5,
"response_time_minutes": 5,
"is_verified": true,
"phone_number": null,
"whatsapp_number": null,
"bank_name": null,
"account_number": null,
"account_name": null,
"createdAt": "2025-11-06T01:01:10.119Z",
"updatedAt": "2025-11-06T01:09:37.980Z"
}
},
"payment_info": {
"send_to": "0x5d0d0e728e6656a279707262e403ca2f2c2aa746",
"amount_usd": "50.00",
"network": "Polygon",
"token": "USDT"
}
}

http://localhost:5001/api/v1/admin/withdrawals/paid

{
"request_id": "16393387-1aff-4823-a62a-a37a782d6aef",
"tx_hash": "0xd6feaa4fd521221bb5c8ded17dda5a35aaaf202c8202780bd657dab3d8aa55af"
}

{
"success": true,
"data": {
"id": "16393387-1aff-4823-a62a-a37a782d6aef",
"agent_id": "2553aa20-748f-4609-9b03-c6a3ed025826",
"amount_usd": "50.00",
"status": "paid",
"admin_notes": null,
"paid_tx_hash": "0xd6feaa4fd521221bb5c8ded17dda5a35aaaf202c8202780bd657dab3d8aa55af",
"paid_at": "2025-11-06T01:26:48.636Z",
"created_at": "2025-11-06T01:14:05.718Z",
"updated_at": "2025-11-06T01:26:48.636Z",
"agent": {
"id": "2553aa20-748f-4609-9b03-c6a3ed025826",
"user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
"country": "NG",
"currency": "NGN",
"tier": "starter",
"status": "active",
"withdrawal_address": "0x5d0d0e728e6656a279707262e403ca2f2c2aa746",
"deposit_usd": 100,
"available_capacity": 100,
"total_minted": 0,
"total_burned": 0,
"rating": 5,
"response_time_minutes": 5,
"is_verified": true,
"phone_number": null,
"whatsapp_number": null,
"bank_name": null,
"account_number": null,
"account_name": null,
"createdAt": "2025-11-06T01:01:10.119Z",
"updatedAt": "2025-11-06T01:26:48.485Z"
}
}
}
