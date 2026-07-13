require('dotenv').config();
const { User, Agent } = require('./src/models');

async function fixAgent() {
  try {
    const user = await User.findOne({ where: { email: 'agent3_ng@gmai.com' } });
    if (!user) {
        console.log("User not found! Searching by agent3...");
        const altUser = await User.findOne({ where: { email: 'agent3_ng@gmail.com' }});
        if (altUser) {
           console.log("Found alt user", altUser.email);
           const agent = await Agent.findOne({ where: { user_id: altUser.id } });
           if (agent) {
               agent.total_minted = 0;
               agent.total_burned = 0;
               agent.deposit_usd = 100000;
               await agent.save();
               console.log("Successfully reset agent capacities for", altUser.email);
           }
        }
    } else {
        const agent = await Agent.findOne({ where: { user_id: user.id } });
        if (!agent) {
            console.log("Agent not found for user!");
        } else {
            agent.total_minted = 0;
            agent.total_burned = 0;
            agent.deposit_usd = 100000;
            await agent.save();
            console.log("Successfully reset agent capacities for", user.email);
        }
    }
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
fixAgent();
