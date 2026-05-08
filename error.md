2026-05-08T13:17:12.365600098Z ==> Running 'npm start'
2026-05-08T13:17:13.471021947Z 
2026-05-08T13:17:13.471045969Z > afrix_backend@1.0.0 start
2026-05-08T13:17:13.471052459Z > node server.js
2026-05-08T13:17:13.471054589Z 
2026-05-08T13:17:13.772767277Z [dotenv@17.3.1] injecting env (0) from .env -- tip: ⚙️  override existing env vars with { override: true }
2026-05-08T13:17:14.563713329Z [dotenv@17.3.1] injecting env (0) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
2026-05-08T13:17:16.072192219Z [dotenv@17.3.1] injecting env (0) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
2026-05-08T13:17:17.674135211Z {"level":"info","message":"ℹ️  Redis is disabled"}
2026-05-08T13:17:21.565573068Z Firebase init skipped: Failed to parse private key: Error: Invalid PEM formatted message.
2026-05-08T13:17:22.463628807Z 🚀 Starting AfriToken Backend...
2026-05-08T13:17:22.463651699Z 
2026-05-08T13:17:22.463668921Z 📊 Testing database connection...
2026-05-08T13:17:22.575838198Z error: ❌ Unable to connect to database: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a {"name":"SequelizeHostNotFoundError","original":{"code":"ENOTFOUND","errno":-3008,"hostname":"dpg-d6ahr5i48b3s73bavbh0-a","syscall":"getaddrinfo"},"parent":{"code":"ENOTFOUND","errno":-3008,"hostname":"dpg-d6ahr5i48b3s73bavbh0-a","syscall":"getaddrinfo"},"stack":"SequelizeHostNotFoundError: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a\n    at Client._connectionCallback (/opt/render/project/src/afriX_backend/node_modules/sequelize/lib/dialects/postgres/connection-manager.js:136:24)\n    at Client._handleErrorWhileConnecting (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:376:19)\n    at Client._handleErrorEvent (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:386:19)\n    at Connection.emit (node:events:508:20)\n    at Socket.reportStreamError (/opt/render/project/src/afriX_backend/node_modules/pg/lib/connection.js:56:12)\n    at Socket.emit (node:events:508:20)\n    at emitErrorNT (node:internal/streams/destroy:170:8)\n    at emitErrorCloseNT (node:internal/streams/destroy:129:3)\n    at process.processTicksAndRejections (node:internal/process/task_queues:90:21)","timestamp":"2026-05-08T13:17:22.574Z"}
2026-05-08T13:17:22.576958692Z ❌ Failed to start server: HostNotFoundError [SequelizeHostNotFoundError]: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a
2026-05-08T13:17:22.576973533Z     at Client._connectionCallback (/opt/render/project/src/afriX_backend/node_modules/sequelize/lib/dialects/postgres/connection-manager.js:136:24)
2026-05-08T13:17:22.576979043Z     at Client._handleErrorWhileConnecting (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:376:19)
2026-05-08T13:17:22.576984104Z     at Client._handleErrorEvent (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:386:19)
2026-05-08T13:17:22.576989404Z     at Connection.emit (node:events:508:20)
2026-05-08T13:17:22.577026997Z     at Socket.reportStreamError (/opt/render/project/src/afriX_backend/node_modules/pg/lib/connection.js:56:12)
2026-05-08T13:17:22.577034378Z     at Socket.emit (node:events:508:20)
2026-05-08T13:17:22.577039438Z     at emitErrorNT (node:internal/streams/destroy:170:8)
2026-05-08T13:17:22.577043708Z     at emitErrorCloseNT (node:internal/streams/destroy:129:3)
2026-05-08T13:17:22.577048328Z     at process.processTicksAndRejections (node:internal/process/task_queues:90:21) {
2026-05-08T13:17:22.577053499Z   parent: Error: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a
2026-05-08T13:17:22.577058229Z       at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:121:26) {
2026-05-08T13:17:22.57706313Z     errno: -3008,
2026-05-08T13:17:22.57706779Z     code: 'ENOTFOUND',
2026-05-08T13:17:22.577084301Z     syscall: 'getaddrinfo',
2026-05-08T13:17:22.577087662Z     hostname: 'dpg-d6ahr5i48b3s73bavbh0-a'
2026-05-08T13:17:22.577090942Z   },
2026-05-08T13:17:22.577094252Z   original: Error: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a
2026-05-08T13:17:22.577097302Z       at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:121:26) {
2026-05-08T13:17:22.577100252Z     errno: -3008,
2026-05-08T13:17:22.577103273Z     code: 'ENOTFOUND',
2026-05-08T13:17:22.577106353Z     syscall: 'getaddrinfo',
2026-05-08T13:17:22.577109423Z     hostname: 'dpg-d6ahr5i48b3s73bavbh0-a'
2026-05-08T13:17:22.577112403Z   }
2026-05-08T13:17:22.577115444Z }
2026-05-08T13:17:29.446479418Z ==> Running 'npm start'
2026-05-08T13:17:30.443875371Z 
2026-05-08T13:17:30.443907024Z > afrix_backend@1.0.0 start
2026-05-08T13:17:30.443912514Z > node server.js
2026-05-08T13:17:30.443915014Z 
2026-05-08T13:17:30.653430175Z [dotenv@17.3.1] injecting env (0) from .env -- tip: ⚙️  enable debug logging with { debug: true }
2026-05-08T13:17:31.352143258Z [dotenv@17.3.1] injecting env (0) from .env -- tip: ⚡️ secrets for agents: https://dotenvx.com/as2
2026-05-08T13:17:32.952531613Z [dotenv@17.3.1] injecting env (0) from .env -- tip: ⚙️  suppress all logs with { quiet: true }
2026-05-08T13:17:34.75340825Z {"level":"info","message":"ℹ️  Redis is disabled"}
2026-05-08T13:17:38.942713616Z Firebase init skipped: Failed to parse private key: Error: Invalid PEM formatted message.
2026-05-08T13:17:39.750367833Z 🚀 Starting AfriToken Backend...
2026-05-08T13:17:39.750391795Z 
2026-05-08T13:17:39.750395726Z 📊 Testing database connection...
2026-05-08T13:17:39.846409359Z error: ❌ Unable to connect to database: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a {"name":"SequelizeHostNotFoundError","original":{"code":"ENOTFOUND","errno":-3008,"hostname":"dpg-d6ahr5i48b3s73bavbh0-a","syscall":"getaddrinfo"},"parent":{"code":"ENOTFOUND","errno":-3008,"hostname":"dpg-d6ahr5i48b3s73bavbh0-a","syscall":"getaddrinfo"},"stack":"SequelizeHostNotFoundError: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a\n    at Client._connectionCallback (/opt/render/project/src/afriX_backend/node_modules/sequelize/lib/dialects/postgres/connection-manager.js:136:24)\n    at Client._handleErrorWhileConnecting (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:376:19)\n    at Client._handleErrorEvent (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:386:19)\n    at Connection.emit (node:events:508:20)\n    at Socket.reportStreamError (/opt/render/project/src/afriX_backend/node_modules/pg/lib/connection.js:56:12)\n    at Socket.emit (node:events:508:20)\n    at emitErrorNT (node:internal/streams/destroy:170:8)\n    at emitErrorCloseNT (node:internal/streams/destroy:129:3)\n    at process.processTicksAndRejections (node:internal/process/task_queues:90:21)","timestamp":"2026-05-08T13:17:39.844Z"}
2026-05-08T13:17:39.846772666Z ❌ Failed to start server: HostNotFoundError [SequelizeHostNotFoundError]: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a
2026-05-08T13:17:39.846780027Z     at Client._connectionCallback (/opt/render/project/src/afriX_backend/node_modules/sequelize/lib/dialects/postgres/connection-manager.js:136:24)
2026-05-08T13:17:39.846783557Z     at Client._handleErrorWhileConnecting (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:376:19)
2026-05-08T13:17:39.846787107Z     at Client._handleErrorEvent (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:386:19)
2026-05-08T13:17:39.846790868Z     at Connection.emit (node:events:508:20)
2026-05-08T13:17:39.846793978Z     at Socket.reportStreamError (/opt/render/project/src/afriX_backend/node_modules/pg/lib/connection.js:56:12)
2026-05-08T13:17:39.846796768Z     at Socket.emit (node:events:508:20)
2026-05-08T13:17:39.846800418Z     at emitErrorNT (node:internal/streams/destroy:170:8)
2026-05-08T13:17:39.846803769Z     at emitErrorCloseNT (node:internal/streams/destroy:129:3)
2026-05-08T13:17:39.846807229Z     at process.processTicksAndRejections (node:internal/process/task_queues:90:21) {
2026-05-08T13:17:39.846810999Z   parent: Error: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a
2026-05-08T13:17:39.846814439Z       at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:121:26) {
2026-05-08T13:17:39.84681824Z     errno: -3008,
2026-05-08T13:17:39.84682167Z     code: 'ENOTFOUND',
2026-05-08T13:17:39.84682528Z     syscall: 'getaddrinfo',
2026-05-08T13:17:39.846838851Z     hostname: 'dpg-d6ahr5i48b3s73bavbh0-a'
2026-05-08T13:17:39.846841292Z   },
2026-05-08T13:17:39.846844102Z   original: Error: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a
2026-05-08T13:17:39.846847492Z       at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:121:26) {
2026-05-08T13:17:39.846850812Z     errno: -3008,
2026-05-08T13:17:39.846854062Z     code: 'ENOTFOUND',
2026-05-08T13:17:39.846857253Z     syscall: 'getaddrinfo',
2026-05-08T13:17:39.846860243Z     hostname: 'dpg-d6ahr5i48b3s73bavbh0-a'
2026-05-08T13:17:39.846863503Z   }
2026-05-08T13:17:39.846866433Z }
2026-05-08T13:18:08.118663604Z ==> Running 'npm start'
2026-05-08T13:18:09.038683534Z 
2026-05-08T13:18:09.038732548Z > afrix_backend@1.0.0 start
2026-05-08T13:18:09.038741568Z > node server.js
2026-05-08T13:18:09.038745319Z 
2026-05-08T13:18:09.327816806Z [dotenv@17.3.1] injecting env (0) from .env -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit
2026-05-08T13:18:10.121053931Z [dotenv@17.3.1] injecting env (0) from .env -- tip: ⚡️ secrets for agents: https://dotenvx.com/as2
2026-05-08T13:18:11.526455067Z [dotenv@17.3.1] injecting env (0) from .env -- tip: ⚙️  enable debug logging with { debug: true }
2026-05-08T13:18:13.118651997Z {"level":"info","message":"ℹ️  Redis is disabled"}
2026-05-08T13:18:16.728431165Z Firebase init skipped: Failed to parse private key: Error: Invalid PEM formatted message.
2026-05-08T13:18:17.618905276Z 🚀 Starting AfriToken Backend...
2026-05-08T13:18:17.618927107Z 
2026-05-08T13:18:17.618933658Z 📊 Testing database connection...
2026-05-08T13:18:17.719948097Z error: ❌ Unable to connect to database: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a {"name":"SequelizeHostNotFoundError","original":{"code":"ENOTFOUND","errno":-3008,"hostname":"dpg-d6ahr5i48b3s73bavbh0-a","syscall":"getaddrinfo"},"parent":{"code":"ENOTFOUND","errno":-3008,"hostname":"dpg-d6ahr5i48b3s73bavbh0-a","syscall":"getaddrinfo"},"stack":"SequelizeHostNotFoundError: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a\n    at Client._connectionCallback (/opt/render/project/src/afriX_backend/node_modules/sequelize/lib/dialects/postgres/connection-manager.js:136:24)\n    at Client._handleErrorWhileConnecting (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:376:19)\n    at Client._handleErrorEvent (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:386:19)\n    at Connection.emit (node:events:508:20)\n    at Socket.reportStreamError (/opt/render/project/src/afriX_backend/node_modules/pg/lib/connection.js:56:12)\n    at Socket.emit (node:events:508:20)\n    at emitErrorNT (node:internal/streams/destroy:170:8)\n    at emitErrorCloseNT (node:internal/streams/destroy:129:3)\n    at process.processTicksAndRejections (node:internal/process/task_queues:90:21)","timestamp":"2026-05-08T13:18:17.719Z"}
2026-05-08T13:18:17.720713714Z ❌ Failed to start server: HostNotFoundError [SequelizeHostNotFoundError]: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a
2026-05-08T13:18:17.720728795Z     at Client._connectionCallback (/opt/render/project/src/afriX_backend/node_modules/sequelize/lib/dialects/postgres/connection-manager.js:136:24)
2026-05-08T13:18:17.720733736Z     at Client._handleErrorWhileConnecting (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:376:19)
2026-05-08T13:18:17.720738646Z     at Client._handleErrorEvent (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:386:19)
2026-05-08T13:18:17.720743347Z     at Connection.emit (node:events:508:20)
2026-05-08T13:18:17.720747477Z     at Socket.reportStreamError (/opt/render/project/src/afriX_backend/node_modules/pg/lib/connection.js:56:12)
2026-05-08T13:18:17.720765168Z     at Socket.emit (node:events:508:20)
2026-05-08T13:18:17.720770599Z     at emitErrorNT (node:internal/streams/destroy:170:8)
2026-05-08T13:18:17.720775079Z     at emitErrorCloseNT (node:internal/streams/destroy:129:3)
2026-05-08T13:18:17.720779809Z     at process.processTicksAndRejections (node:internal/process/task_queues:90:21) {
2026-05-08T13:18:17.72078473Z   parent: Error: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a
2026-05-08T13:18:17.72078914Z       at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:121:26) {
2026-05-08T13:18:17.72079373Z     errno: -3008,
2026-05-08T13:18:17.720797891Z     code: 'ENOTFOUND',
2026-05-08T13:18:17.720816072Z     syscall: 'getaddrinfo',
2026-05-08T13:18:17.720819052Z     hostname: 'dpg-d6ahr5i48b3s73bavbh0-a'
2026-05-08T13:18:17.720821773Z   },
2026-05-08T13:18:17.720824353Z   original: Error: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a
2026-05-08T13:18:17.720826933Z       at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:121:26) {
2026-05-08T13:18:17.720829443Z     errno: -3008,
2026-05-08T13:18:17.720831813Z     code: 'ENOTFOUND',
2026-05-08T13:18:17.720834223Z     syscall: 'getaddrinfo',
2026-05-08T13:18:17.720836663Z     hostname: 'dpg-d6ahr5i48b3s73bavbh0-a'
2026-05-08T13:18:17.720839114Z   }
2026-05-08T13:18:17.720841634Z }
2026-05-08T13:18:51.353312034Z ==> Running 'npm start'
2026-05-08T13:18:52.465461269Z 
2026-05-08T13:18:52.465513463Z > afrix_backend@1.0.0 start
2026-05-08T13:18:52.465519673Z > node server.js
2026-05-08T13:18:52.465523144Z 
2026-05-08T13:18:52.850307422Z [dotenv@17.3.1] injecting env (0) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }
2026-05-08T13:18:53.550077125Z [dotenv@17.3.1] injecting env (0) from .env -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit
2026-05-08T13:18:55.055713852Z [dotenv@17.3.1] injecting env (0) from .env -- tip: 🛡️ auth for agents: https://vestauth.com
2026-05-08T13:18:56.559925732Z {"level":"info","message":"ℹ️  Redis is disabled"}
2026-05-08T13:19:00.356307041Z Firebase init skipped: Failed to parse private key: Error: Invalid PEM formatted message.
2026-05-08T13:19:00.759157146Z 🚀 Starting AfriToken Backend...
2026-05-08T13:19:00.759191719Z 
2026-05-08T13:19:00.759195079Z 📊 Testing database connection...
2026-05-08T13:19:01.248420964Z error: ❌ Unable to connect to database: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a {"name":"SequelizeHostNotFoundError","original":{"code":"ENOTFOUND","errno":-3008,"hostname":"dpg-d6ahr5i48b3s73bavbh0-a","syscall":"getaddrinfo"},"parent":{"code":"ENOTFOUND","errno":-3008,"hostname":"dpg-d6ahr5i48b3s73bavbh0-a","syscall":"getaddrinfo"},"stack":"SequelizeHostNotFoundError: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a\n    at Client._connectionCallback (/opt/render/project/src/afriX_backend/node_modules/sequelize/lib/dialects/postgres/connection-manager.js:136:24)\n    at Client._handleErrorWhileConnecting (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:376:19)\n    at Client._handleErrorEvent (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:386:19)\n    at Connection.emit (node:events:508:20)\n    at Socket.reportStreamError (/opt/render/project/src/afriX_backend/node_modules/pg/lib/connection.js:56:12)\n    at Socket.emit (node:events:508:20)\n    at emitErrorNT (node:internal/streams/destroy:170:8)\n    at emitErrorCloseNT (node:internal/streams/destroy:129:3)\n    at process.processTicksAndRejections (node:internal/process/task_queues:90:21)","timestamp":"2026-05-08T13:19:01.247Z"}
2026-05-08T13:19:01.249436351Z ❌ Failed to start server: HostNotFoundError [SequelizeHostNotFoundError]: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a
2026-05-08T13:19:01.249450382Z     at Client._connectionCallback (/opt/render/project/src/afriX_backend/node_modules/sequelize/lib/dialects/postgres/connection-manager.js:136:24)
2026-05-08T13:19:01.249453792Z     at Client._handleErrorWhileConnecting (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:376:19)
2026-05-08T13:19:01.249457702Z     at Client._handleErrorEvent (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:386:19)
2026-05-08T13:19:01.249460782Z     at Connection.emit (node:events:508:20)
2026-05-08T13:19:01.249466193Z     at Socket.reportStreamError (/opt/render/project/src/afriX_backend/node_modules/pg/lib/connection.js:56:12)
2026-05-08T13:19:01.249468953Z     at Socket.emit (node:events:508:20)
2026-05-08T13:19:01.249472234Z     at emitErrorNT (node:internal/streams/destroy:170:8)
2026-05-08T13:19:01.249474954Z     at emitErrorCloseNT (node:internal/streams/destroy:129:3)
2026-05-08T13:19:01.249478084Z     at process.processTicksAndRejections (node:internal/process/task_queues:90:21) {
2026-05-08T13:19:01.249481394Z   parent: Error: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a
2026-05-08T13:19:01.249484184Z       at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:121:26) {
2026-05-08T13:19:01.249487685Z     errno: -3008,
2026-05-08T13:19:01.249490345Z     code: 'ENOTFOUND',
2026-05-08T13:19:01.249500165Z     syscall: 'getaddrinfo',
2026-05-08T13:19:01.249503016Z     hostname: 'dpg-d6ahr5i48b3s73bavbh0-a'
2026-05-08T13:19:01.249505706Z   },
2026-05-08T13:19:01.249508516Z   original: Error: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a
2026-05-08T13:19:01.249511326Z       at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:121:26) {
2026-05-08T13:19:01.249514066Z     errno: -3008,
2026-05-08T13:19:01.249516757Z     code: 'ENOTFOUND',
2026-05-08T13:19:01.249519437Z     syscall: 'getaddrinfo',
2026-05-08T13:19:01.249522087Z     hostname: 'dpg-d6ahr5i48b3s73bavbh0-a'
2026-05-08T13:19:01.249524907Z   }
2026-05-08T13:19:01.249527618Z }
2026-05-08T13:19:53.9758669Z ==> Running 'npm start'
2026-05-08T13:19:54.991396686Z 
2026-05-08T13:19:54.991432379Z > afrix_backend@1.0.0 start
2026-05-08T13:19:54.991438469Z > node server.js
2026-05-08T13:19:54.991442599Z 
2026-05-08T13:19:55.376151052Z [dotenv@17.3.1] injecting env (0) from .env -- tip: 🛠️  run anywhere with `dotenvx run -- yourcommand`
2026-05-08T13:19:55.98612522Z [dotenv@17.3.1] injecting env (0) from .env -- tip: ⚙️  override existing env vars with { override: true }
2026-05-08T13:19:57.481311462Z [dotenv@17.3.1] injecting env (0) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
2026-05-08T13:19:59.074917949Z {"level":"info","message":"ℹ️  Redis is disabled"}
2026-05-08T13:20:02.881364055Z Firebase init skipped: Failed to parse private key: Error: Invalid PEM formatted message.
2026-05-08T13:20:03.791678087Z 🚀 Starting AfriToken Backend...
2026-05-08T13:20:03.791696358Z 
2026-05-08T13:20:03.791700958Z 📊 Testing database connection...
2026-05-08T13:20:03.878813383Z error: ❌ Unable to connect to database: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a {"name":"SequelizeHostNotFoundError","original":{"code":"ENOTFOUND","errno":-3008,"hostname":"dpg-d6ahr5i48b3s73bavbh0-a","syscall":"getaddrinfo"},"parent":{"code":"ENOTFOUND","errno":-3008,"hostname":"dpg-d6ahr5i48b3s73bavbh0-a","syscall":"getaddrinfo"},"stack":"SequelizeHostNotFoundError: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a\n    at Client._connectionCallback (/opt/render/project/src/afriX_backend/node_modules/sequelize/lib/dialects/postgres/connection-manager.js:136:24)\n    at Client._handleErrorWhileConnecting (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:376:19)\n    at Client._handleErrorEvent (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:386:19)\n    at Connection.emit (node:events:508:20)\n    at Socket.reportStreamError (/opt/render/project/src/afriX_backend/node_modules/pg/lib/connection.js:56:12)\n    at Socket.emit (node:events:508:20)\n    at emitErrorNT (node:internal/streams/destroy:170:8)\n    at emitErrorCloseNT (node:internal/streams/destroy:129:3)\n    at process.processTicksAndRejections (node:internal/process/task_queues:90:21)","timestamp":"2026-05-08T13:20:03.877Z"}
2026-05-08T13:20:03.879750694Z ❌ Failed to start server: HostNotFoundError [SequelizeHostNotFoundError]: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a
2026-05-08T13:20:03.879766205Z     at Client._connectionCallback (/opt/render/project/src/afriX_backend/node_modules/sequelize/lib/dialects/postgres/connection-manager.js:136:24)
2026-05-08T13:20:03.879770005Z     at Client._handleErrorWhileConnecting (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:376:19)
2026-05-08T13:20:03.879773465Z     at Client._handleErrorEvent (/opt/render/project/src/afriX_backend/node_modules/pg/lib/client.js:386:19)
2026-05-08T13:20:03.879778026Z     at Connection.emit (node:events:508:20)
2026-05-08T13:20:03.879783216Z     at Socket.reportStreamError (/opt/render/project/src/afriX_backend/node_modules/pg/lib/connection.js:56:12)
2026-05-08T13:20:03.879787896Z     at Socket.emit (node:events:508:20)
2026-05-08T13:20:03.879793037Z     at emitErrorNT (node:internal/streams/destroy:170:8)
2026-05-08T13:20:03.879798127Z     at emitErrorCloseNT (node:internal/streams/destroy:129:3)
2026-05-08T13:20:03.879802998Z     at process.processTicksAndRejections (node:internal/process/task_queues:90:21) {
2026-05-08T13:20:03.879807898Z   parent: Error: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a
2026-05-08T13:20:03.879812748Z       at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:121:26) {
2026-05-08T13:20:03.879816769Z     errno: -3008,
2026-05-08T13:20:03.879819939Z     code: 'ENOTFOUND',
2026-05-08T13:20:03.87983315Z     syscall: 'getaddrinfo',
2026-05-08T13:20:03.87983661Z     hostname: 'dpg-d6ahr5i48b3s73bavbh0-a'
2026-05-08T13:20:03.8798395Z   },
2026-05-08T13:20:03.8798421Z   original: Error: getaddrinfo ENOTFOUND dpg-d6ahr5i48b3s73bavbh0-a
2026-05-08T13:20:03.879844661Z       at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:121:26) {
2026-05-08T13:20:03.879847341Z     errno: -3008,
2026-05-08T13:20:03.879850461Z     code: 'ENOTFOUND',
2026-05-08T13:20:03.879853211Z     syscall: 'getaddrinfo',
2026-05-08T13:20:03.879855922Z     hostname: 'dpg-d6ahr5i48b3s73bavbh0-a'
2026-05-08T13:20:03.879858682Z   }
2026-05-08T13:20:03.879861472Z }