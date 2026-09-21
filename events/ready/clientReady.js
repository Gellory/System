const Data = require("pro.db");

// Variable to track if ready has been triggered
let isReadyTriggered = false;

module.exports = async (client) => {
    // Prevent multiple triggers
    if (isReadyTriggered) return;
    isReadyTriggered = true;

    // Clear console for cleaner output
    console.clear();
    
    // Show bot is starting
    console.log(`Starting ${client.user.tag}...\n`);
    
    // Show bot info in a table
    //console.table({
     //   Name: client.user.tag,
      //  Ping: client.ws.ping,
    //    Prefix: client.prefix || 'Not set',
     //   ID: client.user.id,
    //    Server: client.guilds.cache.size,
    //    Members: client.users.cache.size,
     //   Channels: client.channels.cache.size,
      //  Developer: "EyadZaraStore"
   // })

    // Load command aliases
    client.commands.forEach(command => {
        const aliases = Data.get(`aliases_${command.name}`);
        if (aliases) {  
            command.aliases = aliases;
            client.commands.set(command.name, command);
        }
    });
};
