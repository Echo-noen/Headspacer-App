const { WebhookClient } = require('discord.js');
const { owner, pfps } = require('../../config.json');

module.exports = {
    name: 'sendas',
    description: 'Resends a message with a specified name using a webhook.',
    isSlashCommand: false,
    regex: /^(?:\.\.SENDAS|\.\.sendas) ?(?:\[(.+?)\]|(\w+)) (.+)$/,

    async execute(message) {
        
        

        if (!message.content) {
            console.error('Error: message.content is undefined.');
            await message.reply("There was an issue processing your command.");
            return;
        }

        const match = message.content.match(this.regex);

        if (!match) {
            await message.reply("Please use the correct format: `..SENDAS [name] [message]`");
            return;
        }
        
        const name = match[1] || match[2];
        let content = match[3];


        // if (!owner.includes(message.author.id)) {
        if (message.author.id !== "737974916539875348") {
            content += `\n-# Message sent by @${message.author.username}`
        }

        if (!message.channel.type === 'GUILD_TEXT') {
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

        function imageGenerator(name) {
            let sum = 0;
            for (let i = 0; i < name.length; i++) {
                sum += name.charCodeAt(i);
            }
            return sum % 10;
        }
        
        try {
            await webhook.send({
                content: content,
                username: name,
                avatarURL: pfps[imageGenerator(name.toString().toLowerCase())]
            });

            await message.delete();

            // await message.reply({ content: 'Message sent via webhook!', ephemeral: true });
        } catch (error) {
            console.error('Error sending message via webhook:', error);
            await message.reply('There was an error sending the message.');
            
        }
    }
};
