2026-05-08T14:07:09.77854981Z ==> Downloading cache...
2026-05-08T14:07:09.831884873Z ==> Cloning from https://github.com/Harzkane/AfriX
2026-05-08T14:07:12.190067397Z ==> Checking out commit 9473554cea8228677992e1f2802599b14587bd36 in branch main
2026-05-08T14:07:19.902694191Z ==> Downloaded 246MB in 3s. Extraction took 7s.
2026-05-08T14:07:26.574905494Z ==> Requesting Node.js version >=16.0.0
2026-05-08T14:07:26.796569782Z ==> Using Node.js version 26.1.0 via /opt/render/project/src/afriX_backend/package.json
2026-05-08T14:07:26.833860343Z ==> Docs on specifying a Node.js version: https://render.com/docs/node-version
2026-05-08T14:07:27.086928405Z ==> Running build command 'npm install'...
2026-05-08T14:08:38.107596088Z 
2026-05-08T14:08:38.107637491Z added 553 packages, and audited 554 packages in 1m
2026-05-08T14:08:38.107651733Z 
2026-05-08T14:08:38.10775411Z 76 packages are looking for funding
2026-05-08T14:08:38.107818255Z   run `npm fund` for details
2026-05-08T14:08:38.116086815Z 
2026-05-08T14:08:38.116107637Z 10 vulnerabilities (8 low, 1 moderate, 1 high)
2026-05-08T14:08:38.116114577Z 
2026-05-08T14:08:38.116121588Z To address issues that do not require attention, run:
2026-05-08T14:08:38.116127788Z   npm audit fix
2026-05-08T14:08:38.116133359Z 
2026-05-08T14:08:38.116139609Z To address all issues (including breaking changes), run:
2026-05-08T14:08:38.11614595Z   npm audit fix --force
2026-05-08T14:08:38.11614984Z 
2026-05-08T14:08:38.11615426Z Run `npm audit` for details.
2026-05-08T14:08:45.843860839Z ==> Uploading build...
2026-05-08T14:08:52.909538085Z ==> Uploaded in 3.5s. Compression took 3.6s
2026-05-08T14:08:52.936024343Z ==> Build successful 🎉
2026-05-08T14:08:57.239490484Z ==> Deploying...
2026-05-08T14:08:57.560407325Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-08T14:09:10.900447286Z ==> Running 'npm start'
2026-05-08T14:09:12.62550599Z 
2026-05-08T14:09:12.625534242Z > afrix_backend@1.0.0 start
2026-05-08T14:09:12.625540083Z > node server.js
2026-05-08T14:09:12.625543663Z 
2026-05-08T14:09:12.913263994Z ◇ injected env (0) from .env // tip: ◈ encrypted .env [www.dotenvx.com]
2026-05-08T14:09:13.700088811Z ◇ injected env (0) from .env // tip: ⌘ suppress logs { quiet: true }
2026-05-08T14:09:15.110995172Z ◇ injected env (0) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }
2026-05-08T14:09:16.409614899Z {"level":"info","message":"ℹ️  Redis is disabled"}
2026-05-08T14:09:20.113487098Z Firebase init skipped: Failed to parse private key: Error: Invalid PEM formatted message.
2026-05-08T14:09:20.619946238Z 🚀 Starting AfriToken Backend...
2026-05-08T14:09:20.619960099Z 
2026-05-08T14:09:20.619963269Z 📊 Testing database connection...
2026-05-08T14:09:21.340081637Z info: ✅ Database connection established successfully {"timestamp":"2026-05-08T14:09:21.339Z"}
2026-05-08T14:09:21.340150482Z 🔧 Initializing database...
2026-05-08T14:09:23.331933164Z ✅ Database models synchronized
2026-05-08T14:09:23.331953215Z 💾 Redis is disabled (using in-memory cache)
2026-05-08T14:09:23.33374324Z 
2026-05-08T14:09:23.333754971Z ✅ Server running on port 10000
2026-05-08T14:09:23.333765732Z 📍 Environment: production
2026-05-08T14:09:23.333786143Z 🌐 API Base URL: http://localhost:10000/api/v1
2026-05-08T14:09:23.333790503Z 🌐 On network: http://<this-machine-ip>:10000/api/v1
2026-05-08T14:09:23.333802524Z 🏥 Health Check: http://localhost:10000/health
2026-05-08T14:09:23.333807365Z 
2026-05-08T14:09:23.333811545Z 📝 Available endpoints:
2026-05-08T14:09:23.333820356Z    - POST /api/v1/auth/register
2026-05-08T14:09:23.333824226Z    - POST /api/v1/auth/login
2026-05-08T14:09:23.333838887Z    - POST /api/v1/auth/verify-email
2026-05-08T14:09:23.333848018Z    - GET  /api/v1/auth/me
2026-05-08T14:09:23.333850988Z 
2026-05-08T14:09:23.333894072Z 🎯 Ready for Postman testing!
2026-05-08T14:09:23.333898102Z 
2026-05-08T14:09:23.512556269Z 127.0.0.1 - - [08/May/2026:14:09:23 +0000] "HEAD / HTTP/1.1" 200 318 "-" "Go-http-client/1.1"
2026-05-08T14:09:28.083108202Z ==> Your service is live 🎉
2026-05-08T14:09:28.316862833Z ==> 
2026-05-08T14:09:28.319866146Z ==> ///////////////////////////////////////////////////////////
2026-05-08T14:09:28.322148648Z ==> 
2026-05-08T14:09:28.324422819Z ==> Available at your primary URL https://afrix-iqvq.onrender.com
2026-05-08T14:09:28.326895509Z ==> 
2026-05-08T14:09:28.329020374Z ==> ///////////////////////////////////////////////////////////