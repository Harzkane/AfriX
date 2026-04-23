GET /api/v1/admin/operations/disputes/stats 304 12.199 ms - -
List disputes error: Error
    at Query.run (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)
    at /Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/sequelize/lib/sequelize.js:315:28
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async PostgresQueryInterface.select (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/sequelize/lib/dialects/abstract/query-interface.js:407:12)
    at async Dispute.findAll (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/sequelize/lib/model.js:1140:21)
    at async Promise.all (index 1)
    at async Dispute.findAndCountAll (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/sequelize/lib/model.js:1322:27)
    at async listDisputes (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/controllers/adminOperationsController.js:132:24) {
  name: 'SequelizeDatabaseError',
  parent: error: invalid input value for enum enum_disputes_escalation_level: "level_3"
      at Parser.parseErrorMessage (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:519:28)
      at addChunk (node:internal/streams/readable:561:12)
      at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
      at Readable.push (node:internal/streams/readable:392:5)
      at TCP.onStreamRead (node:internal/stream_base_commons:189:23) {
    length: 126,
    severity: 'ERROR',
    code: '22P02',
    detail: undefined,
    hint: undefined,
    position: '1824',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'enum.c',
    line: '132',
    routine: 'enum_in',
    sql: `SELECT "Dispute"."id", "Dispute"."escrow_id", "Dispute"."mint_request_id", "Dispute"."transaction_id", "Dispute"."opened_by_user_id", "Dispute"."agent_id", "Dispute"."reason", "Dispute"."details", "Dispute"."status", "Dispute"."escalation_level", "Dispute"."resolution", "Dispute"."created_at", "Dispute"."updated_at", "escrow"."id" AS "escrow.id", "escrow"."amount" AS "escrow.amount", "escrow"."token_type" AS "escrow.token_type", "escrow"."status" AS "escrow.status", "escrow->transaction"."id" AS "escrow.transaction.id", "escrow->transaction"."reference" AS "escrow.transaction.reference", "escrow->transaction"."type" AS "escrow.transaction.type", "escrow->transaction"."amount" AS "escrow.transaction.amount", "escrow->transaction"."status" AS "escrow.transaction.status", "mintRequest"."id" AS "mintRequest.id", "mintRequest"."amount" AS "mintRequest.amount", "mintRequest"."token_type" AS "mintRequest.token_type", "mintRequest"."status" AS "mintRequest.status", "mintRequest"."rejection_reason" AS "mintRequest.rejection_reason", "mintRequest"."user_bank_reference" AS "mintRequest.user_bank_reference", "user"."id" AS "user.id", "user"."full_name" AS "user.full_name", "user"."email" AS "user.email", "agent"."id" AS "agent.id", "agent"."tier" AS "agent.tier", "agent"."rating" AS "agent.rating" FROM "disputes" AS "Dispute" LEFT OUTER JOIN "escrows" AS "escrow" ON "Dispute"."escrow_id" = "escrow"."id" LEFT OUTER JOIN "transactions" AS "escrow->transaction" ON "escrow"."transaction_id" = "escrow->transaction"."id" LEFT OUTER JOIN "mint_requests" AS "mintRequest" ON "Dispute"."mint_request_id" = "mintRequest"."id" LEFT OUTER JOIN "users" AS "user" ON "Dispute"."opened_by_user_id" = "user"."id" LEFT OUTER JOIN "agents" AS "agent" ON "Dispute"."agent_id" = "agent"."id" WHERE "Dispute"."escalation_level" = 'level_3' ORDER BY "Dispute"."created_at" DESC LIMIT 15 OFFSET 0;`,
    parameters: undefined
  },
  original: error: invalid input value for enum enum_disputes_escalation_level: "level_3"
      at Parser.parseErrorMessage (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:519:28)
      at addChunk (node:internal/streams/readable:561:12)
      at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
      at Readable.push (node:internal/streams/readable:392:5)
      at TCP.onStreamRead (node:internal/stream_base_commons:189:23) {
    length: 126,
    severity: 'ERROR',
    code: '22P02',
    detail: undefined,
    hint: undefined,
    position: '1824',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'enum.c',
    line: '132',
    routine: 'enum_in',
    sql: `SELECT "Dispute"."id", "Dispute"."escrow_id", "Dispute"."mint_request_id", "Dispute"."transaction_id", "Dispute"."opened_by_user_id", "Dispute"."agent_id", "Dispute"."reason", "Dispute"."details", "Dispute"."status", "Dispute"."escalation_level", "Dispute"."resolution", "Dispute"."created_at", "Dispute"."updated_at", "escrow"."id" AS "escrow.id", "escrow"."amount" AS "escrow.amount", "escrow"."token_type" AS "escrow.token_type", "escrow"."status" AS "escrow.status", "escrow->transaction"."id" AS "escrow.transaction.id", "escrow->transaction"."reference" AS "escrow.transaction.reference", "escrow->transaction"."type" AS "escrow.transaction.type", "escrow->transaction"."amount" AS "escrow.transaction.amount", "escrow->transaction"."status" AS "escrow.transaction.status", "mintRequest"."id" AS "mintRequest.id", "mintRequest"."amount" AS "mintRequest.amount", "mintRequest"."token_type" AS "mintRequest.token_type", "mintRequest"."status" AS "mintRequest.status", "mintRequest"."rejection_reason" AS "mintRequest.rejection_reason", "mintRequest"."user_bank_reference" AS "mintRequest.user_bank_reference", "user"."id" AS "user.id", "user"."full_name" AS "user.full_name", "user"."email" AS "user.email", "agent"."id" AS "agent.id", "agent"."tier" AS "agent.tier", "agent"."rating" AS "agent.rating" FROM "disputes" AS "Dispute" LEFT OUTER JOIN "escrows" AS "escrow" ON "Dispute"."escrow_id" = "escrow"."id" LEFT OUTER JOIN "transactions" AS "escrow->transaction" ON "escrow"."transaction_id" = "escrow->transaction"."id" LEFT OUTER JOIN "mint_requests" AS "mintRequest" ON "Dispute"."mint_request_id" = "mintRequest"."id" LEFT OUTER JOIN "users" AS "user" ON "Dispute"."opened_by_user_id" = "user"."id" LEFT OUTER JOIN "agents" AS "agent" ON "Dispute"."agent_id" = "agent"."id" WHERE "Dispute"."escalation_level" = 'level_3' ORDER BY "Dispute"."created_at" DESC LIMIT 15 OFFSET 0;`,
    parameters: undefined
  },
  sql: `SELECT "Dispute"."id", "Dispute"."escrow_id", "Dispute"."mint_request_id", "Dispute"."transaction_id", "Dispute"."opened_by_user_id", "Dispute"."agent_id", "Dispute"."reason", "Dispute"."details", "Dispute"."status", "Dispute"."escalation_level", "Dispute"."resolution", "Dispute"."created_at", "Dispute"."updated_at", "escrow"."id" AS "escrow.id", "escrow"."amount" AS "escrow.amount", "escrow"."token_type" AS "escrow.token_type", "escrow"."status" AS "escrow.status", "escrow->transaction"."id" AS "escrow.transaction.id", "escrow->transaction"."reference" AS "escrow.transaction.reference", "escrow->transaction"."type" AS "escrow.transaction.type", "escrow->transaction"."amount" AS "escrow.transaction.amount", "escrow->transaction"."status" AS "escrow.transaction.status", "mintRequest"."id" AS "mintRequest.id", "mintRequest"."amount" AS "mintRequest.amount", "mintRequest"."token_type" AS "mintRequest.token_type", "mintRequest"."status" AS "mintRequest.status", "mintRequest"."rejection_reason" AS "mintRequest.rejection_reason", "mintRequest"."user_bank_reference" AS "mintRequest.user_bank_reference", "user"."id" AS "user.id", "user"."full_name" AS "user.full_name", "user"."email" AS "user.email", "agent"."id" AS "agent.id", "agent"."tier" AS "agent.tier", "agent"."rating" AS "agent.rating" FROM "disputes" AS "Dispute" LEFT OUTER JOIN "escrows" AS "escrow" ON "Dispute"."escrow_id" = "escrow"."id" LEFT OUTER JOIN "transactions" AS "escrow->transaction" ON "escrow"."transaction_id" = "escrow->transaction"."id" LEFT OUTER JOIN "mint_requests" AS "mintRequest" ON "Dispute"."mint_request_id" = "mintRequest"."id" LEFT OUTER JOIN "users" AS "user" ON "Dispute"."opened_by_user_id" = "user"."id" LEFT OUTER JOIN "agents" AS "agent" ON "Dispute"."agent_id" = "agent"."id" WHERE "Dispute"."escalation_level" = 'level_3' ORDER BY "Dispute"."created_at" DESC LIMIT 15 OFFSET 0;`,
  parameters: {}
}
GET /api/v1/admin/operations/disputes?limit=15&offset=0&escalation_level=level_3 500 11.168 ms - 100