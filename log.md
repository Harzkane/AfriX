❯ npm run seed:path-a-pilot-merchant

> afrix_backend@1.0.0 seed:path-a-pilot-merchant
> node src/scripts/create_path_a_pilot_merchant.js

[dotenv@17.2.3] injecting env (118) from .env -- tip: 📡 add observability to secrets: https://dotenvx.com/ops
[dotenv@17.2.3] injecting env (0) from .env -- tip: 🔄 add secrets lifecycle management: https://dotenvx.com/ops
Connecting to AfriExchange database...
Database connected
Failed to create Path A pilot merchant: Error
    at Query.run (/Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/node_modules/sequelize/lib/sequelize.js:315:28
    at async PostgresQueryInterface.insert (/Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/node_modules/sequelize/lib/dialects/abstract/query-interface.js:308:21)
    at async model.save (/Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/node_modules/sequelize/lib/model.js:2490:35)
    at async users.create (/Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/node_modules/sequelize/lib/model.js:1362:12)
    at async ensurePathAPilotMerchant (/Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/src/scripts/create_path_a_pilot_merchant.js:41:14) {
  name: 'SequelizeUniqueConstraintError',
  errors: [
    ValidationErrorItem {
      message: 'phone_number must be unique',
      type: 'unique violation',
      path: 'phone_number',
      value: '+221000000001',
      origin: 'DB',
      instance: [users],
      validatorKey: 'not_unique',
      validatorName: null,
      validatorArgs: []
    }
  ],
  parent: error: duplicate key value violates unique constraint "users_phone_number"
      at Parser.parseErrorMessage (/Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:519:28)
      at addChunk (node:internal/streams/readable:561:12)
      at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
      at Readable.push (node:internal/streams/readable:392:5)
      at TCP.onStreamRead (node:internal/stream_base_commons:189:23) {
    length: 218,
    severity: 'ERROR',
    code: '23505',
    detail: 'Key (phone_number)=(+221000000001) already exists.',
    hint: undefined,
    position: undefined,
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: 'public',
    table: 'users',
    column: undefined,
    dataType: undefined,
    constraint: 'users_phone_number',
    file: 'nbtinsert.c',
    line: '670',
    routine: '_bt_check_unique',
    sql: 'INSERT INTO "users" ("id","email","password_hash","full_name","phone_number","country_code","role","email_verified","phone_verified","identity_verified","verification_level","education_what_are_tokens","education_how_agents_work","education_understanding_value","education_safety_security","language","theme","push_notifications_enabled","email_notifications_enabled","sms_notifications_enabled","two_factor_enabled","login_attempts","is_active","is_suspended","created_at","updated_at") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26) RETURNING "id","email","password_hash","full_name","phone_number","country_code","role","email_verified","email_verification_token","email_verification_expires","phone_verified","identity_verified","verification_level","password_reset_token","password_reset_expires","education_what_are_tokens","education_how_agents_work","education_understanding_value","education_safety_security","language","theme","push_notifications_enabled","email_notifications_enabled","sms_notifications_enabled","two_factor_enabled","two_factor_secret","last_login_at","last_login_ip","login_attempts","locked_until","is_active","is_suspended","suspension_reason","suspended_until","referral_code","referred_by","last_unlocked_at","last_unlocked_by_id","last_reset_attempts_at","last_reset_attempts_by_id","created_at","updated_at";',
    parameters: [
      '188aa30a-78b5-4e22-9afa-2c5cfbf6ac29',
      'path-a-pilot@afriexchange.local',
      '$2b$12$bIXdvvy6hVqny6pr0IlsOunvKHtODarsMrThS5Dnc15bFm5YHWE1K',
      'Path A Pilot Merchant',
      '+221000000001',
      'SN',
      'merchant',
      true,
      true,
      true,
      3,
      false,
      false,
      false,
      false,
      'en',
      'nigeria',
      true,
      true,
      false,
      false,
      0,
      true,
      false,
      '2026-05-08 15:45:45.837 +01:00',
      '2026-05-08 15:45:45.838 +01:00'
    ]
  },
  original: error: duplicate key value violates unique constraint "users_phone_number"
      at Parser.parseErrorMessage (/Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:519:28)
      at addChunk (node:internal/streams/readable:561:12)
      at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
      at Readable.push (node:internal/streams/readable:392:5)
      at TCP.onStreamRead (node:internal/stream_base_commons:189:23) {
    length: 218,
    severity: 'ERROR',
    code: '23505',
    detail: 'Key (phone_number)=(+221000000001) already exists.',
    hint: undefined,
    position: undefined,
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: 'public',
    table: 'users',
    column: undefined,
    dataType: undefined,
    constraint: 'users_phone_number',
    file: 'nbtinsert.c',
    line: '670',
    routine: '_bt_check_unique',
    sql: 'INSERT INTO "users" ("id","email","password_hash","full_name","phone_number","country_code","role","email_verified","phone_verified","identity_verified","verification_level","education_what_are_tokens","education_how_agents_work","education_understanding_value","education_safety_security","language","theme","push_notifications_enabled","email_notifications_enabled","sms_notifications_enabled","two_factor_enabled","login_attempts","is_active","is_suspended","created_at","updated_at") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26) RETURNING "id","email","password_hash","full_name","phone_number","country_code","role","email_verified","email_verification_token","email_verification_expires","phone_verified","identity_verified","verification_level","password_reset_token","password_reset_expires","education_what_are_tokens","education_how_agents_work","education_understanding_value","education_safety_security","language","theme","push_notifications_enabled","email_notifications_enabled","sms_notifications_enabled","two_factor_enabled","two_factor_secret","last_login_at","last_login_ip","login_attempts","locked_until","is_active","is_suspended","suspension_reason","suspended_until","referral_code","referred_by","last_unlocked_at","last_unlocked_by_id","last_reset_attempts_at","last_reset_attempts_by_id","created_at","updated_at";',
    parameters: [
      '188aa30a-78b5-4e22-9afa-2c5cfbf6ac29',
      'path-a-pilot@afriexchange.local',
      '$2b$12$bIXdvvy6hVqny6pr0IlsOunvKHtODarsMrThS5Dnc15bFm5YHWE1K',
      'Path A Pilot Merchant',
      '+221000000001',
      'SN',
      'merchant',
      true,
      true,
      true,
      3,
      false,
      false,
      false,
      false,
      'en',
      'nigeria',
      true,
      true,
      false,
      false,
      0,
      true,
      false,
      '2026-05-08 15:45:45.837 +01:00',
      '2026-05-08 15:45:45.838 +01:00'
    ]
  },
  fields: { phone_number: '+221000000001' },
  sql: 'INSERT INTO "users" ("id","email","password_hash","full_name","phone_number","country_code","role","email_verified","phone_verified","identity_verified","verification_level","education_what_are_tokens","education_how_agents_work","education_understanding_value","education_safety_security","language","theme","push_notifications_enabled","email_notifications_enabled","sms_notifications_enabled","two_factor_enabled","login_attempts","is_active","is_suspended","created_at","updated_at") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26) RETURNING "id","email","password_hash","full_name","phone_number","country_code","role","email_verified","email_verification_token","email_verification_expires","phone_verified","identity_verified","verification_level","password_reset_token","password_reset_expires","education_what_are_tokens","education_how_agents_work","education_understanding_value","education_safety_security","language","theme","push_notifications_enabled","email_notifications_enabled","sms_notifications_enabled","two_factor_enabled","two_factor_secret","last_login_at","last_login_ip","login_attempts","locked_until","is_active","is_suspended","suspension_reason","suspended_until","referral_code","referred_by","last_unlocked_at","last_unlocked_by_id","last_reset_attempts_at","last_reset_attempts_by_id","created_at","updated_at";'
}