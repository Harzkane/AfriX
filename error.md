❯ clear
❯ npm start

> afrix_backend@1.0.0 start
> node server.js

[dotenv@17.2.3] injecting env (106) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
[dotenv@17.2.3] injecting env (0) from .env -- tip: 👥 sync secrets across teammates & machines: https://dotenvx.com/ops
[dotenv@17.2.3] injecting env (0) from .env -- tip: 🔄 add secrets lifecycle management: https://dotenvx.com/ops
{"level":"info","message":"ℹ️  Redis is disabled"}
🚀 Starting AfriToken Backend...

📊 Testing database connection...
error: ❌ Unable to connect to database: database "afritokens" does not exist {"name":"SequelizeConnectionError","original":{"code":"3D000","file":"postinit.c","length":95,"line":"890","name":"error","routine":"InitPostgres","severity":"FATAL"},"parent":{"code":"3D000","file":"postinit.c","length":95,"line":"890","name":"error","routine":"InitPostgres","severity":"FATAL"},"stack":"SequelizeConnectionError: database \"afritokens\" does not exist\n    at Client._connectionCallback (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/sequelize/lib/dialects/postgres/connection-manager.js:145:24)\n    at Client._handleErrorWhileConnecting (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg/lib/client.js:336:19)\n    at Client._handleErrorMessage (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg/lib/client.js:356:19)\n    at Connection.emit (node:events:519:28)\n    at /Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg/lib/connection.js:116:12\n    at Parser.parse (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:36:17)\n    at Socket.<anonymous> (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/index.js:11:42)\n    at Socket.emit (node:events:519:28)\n    at addChunk (node:internal/streams/readable:559:12)\n    at readableAddChunkPushByteMode (node:internal/streams/readable:510:3)","timestamp":"2026-01-08T00:37:28.736Z"}
❌ Failed to start server: ConnectionError [SequelizeConnectionError]: database "afritokens" does not exist
    at Client._connectionCallback (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/sequelize/lib/dialects/postgres/connection-manager.js:145:24)
    at Client._handleErrorWhileConnecting (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg/lib/client.js:336:19)
    at Client._handleErrorMessage (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg/lib/client.js:356:19)
    at Connection.emit (node:events:519:28)
    at /Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg/lib/connection.js:116:12
    at Parser.parse (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:36:17)
    at Socket.<anonymous> (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/index.js:11:42)
    at Socket.emit (node:events:519:28)
    at addChunk (node:internal/streams/readable:559:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:510:3) {
  parent: error: database "afritokens" does not exist
      at Parser.parseErrorMessage (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:519:28)
      at addChunk (node:internal/streams/readable:559:12)
      at readableAddChunkPushByteMode (node:internal/streams/readable:510:3)
      at Readable.push (node:internal/streams/readable:390:5)
      at TCP.onStreamRead (node:internal/stream_base_commons:191:23) {
    length: 95,
    severity: 'FATAL',
    code: '3D000',
    detail: undefined,
    hint: undefined,
    position: undefined,
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'postinit.c',
    line: '890',
    routine: 'InitPostgres'
  },
  original: error: database "afritokens" does not exist
      at Parser.parseErrorMessage (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:285:98)
      at Parser.handlePacket (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:122:29)
      at Parser.parse (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/parser.js:35:38)
      at Socket.<anonymous> (/Users/harz/Documents/backUps/AfriExchange/afriX_backend/node_modules/pg-protocol/dist/index.js:11:42)
      at Socket.emit (node:events:519:28)
      at addChunk (node:internal/streams/readable:559:12)
      at readableAddChunkPushByteMode (node:internal/streams/readable:510:3)
      at Readable.push (node:internal/streams/readable:390:5)
      at TCP.onStreamRead (node:internal/stream_base_commons:191:23) {
    length: 95,
    severity: 'FATAL',
    code: '3D000',
    detail: undefined,
    hint: undefined,
    position: undefined,
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'postinit.c',
    line: '890',
    routine: 'InitPostgres'
  }
}

  ~/Doc/b/AfriExchange/afriX_backend   main !12 ?4 ❯                               system  01:37:28