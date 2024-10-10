const { WebhookClient } = require('discord.js');
const { owner } = require('../../config.json');
const fs = require('fs');
const path = require('path');
const dbPath = path.resolve(__dirname, '../../database.json');
const { activeProxies } = require('./autoproxy.js');
const { finalization } = require('process');

module.exports = {
    name: 'proxy',
    description: 'Resends a message with a specified name in the database using a webhook.',
    isSlashCommand: false,

    async execute(message) {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));;

        const isOwner = owner.includes(message.author.id);
        const userInProxy = db.data.some(entry => entry.users && entry.users.includes(message.author.id));
        const hasAutoProxy = activeProxies[message.author.id];

        if (!isOwner && !userInProxy && !hasAutoProxy) {
            return;
        }

        const proxies = db.data.filter(entry => 
            entry.proxy && 
            entry.proxy.includes('text') && 
            entry.account && 
            (entry.account === message.author.id || (Array.isArray(entry.users) && entry.users.includes(message.author.id)))
        );
        
        for (const proxyEntry of proxies) {
            const proxyPattern = proxyEntry.proxy.replace('text', '(.*)');
            
            const regex = new RegExp(`^${proxyPattern}$`);
            
            const match = message.content.match(regex);
            if (match) {
                const content = (match[1]).trim();

                if (!content && !hasAutoProxy) {
                    console.log('Empty message content detected, skipping proxy.');
                    return;
                }

                if (message.channel.type !== 0) { //https://discord-api-types.dev/api/discord-api-types-v10/enum/ChannelType
                    await message.reply('This command can only be used in text channels.');
                    return;
                }
        
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
                        await message.reply('Could not create a webhook. Please try again.');
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
                    await message.reply('There was an error sending the message.');
                }
                break;
            }
        }
    }
};