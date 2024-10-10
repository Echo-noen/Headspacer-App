const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const dbPath = path.resolve(__dirname, 'database.json');
let db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const proxyHandler = require('./commands/utility/proxy.js');
const { activeProxies } = require('./commands/utility/autoproxy.js');

(async () => {
    await require('./deploy-commands.js')();
})();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();
client.messageCommands = [];

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }

        if ('regex' in command && 'execute' in command) {
            client.messageCommands.push(command);
        }
    }
}

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});


client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    for (const command of client.messageCommands) {
        if (command.regex.test(message.content)) {
            await command.execute(message);
            return;
        }
    }

    await proxyHandler.execute(message);

    const proxyEntry = activeProxies[message.author.id];
    if (proxyEntry) {
        const otherProxies = db.data.filter(entry => entry.proxy && entry.proxy.includes('text'));

        let isOtherProxy = false;
        for (const otherProxyEntry of otherProxies) {
            const proxyPattern = otherProxyEntry.proxy.replace('text', '(.*)');
            const regex = new RegExp(`^(.*)${proxyPattern}(.*)$`, 'i');

            if (regex.test(message.content)) {
                isOtherProxy = true;
                break;
            }
        }

        if (!isOtherProxy) {
            const content = message.content.trim();
            let webhooks = await message.channel.fetchWebhooks();
            let webhook = webhooks.find(wh => wh.name === `Headspacer-Webhook`);

            if (!webhook) {
                try {
                    webhook = await message.channel.createWebhook({
                        name: `Headspacer-Webhook`,
                    });
                    console.log(`Webhook created in channel: ${message.channel.name} with ID: ${webhook.id}`);
                } catch (error) {
                    console.error(`Error creating webhook in channel ${message.channel.name}:`, error);
                    return;
                }
            }

            let newContent;

            if (message.reference) {
                newContent = `Replying to https://discord.com/channels/${message.reference.guildId}/${message.reference.channelId}/${message.reference.messageId}:\n${content}`;
            } else {
                newContent = content;
            }

            const userEntry = db.users.find(user => user.account === message.author.id);
            const tag = userEntry?.tag || '';
            
            const finalUsername = tag.replace(/text/g, proxyEntry.name);

            const webhookOptions = {
                content: newContent,
                username: finalUsername || proxyEntry.name,
                avatarURL: proxyEntry.avatar,
            };

            try {
                await webhook.send(webhookOptions);

                await message.delete();
            } catch (error) {
                console.error('Error sending message via webhook:', error);
            }
        }
    }
});


client.login(token);