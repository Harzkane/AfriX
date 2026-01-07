UPDATE agent_kyc SET status = 'approved', reviewed_at = NOW() WHERE id = 'b228179f-7a2c-49bd-920e-c64a9397b43f';
UPDATE agents SET status = 'active' WHERE id = 'cfc80083-6df1-48f1-9226-4f3345e38a2f';