const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { owner } = require("../../config.json")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays a list of all available commands.'),

    async execute(interaction) {

        const fields = [
            { name: '/ping', value: 'Replies with Pong.\nIf it throws an error, the bot is offline. Contact the developer(s) in that case.', inline: false },
            { name: '..sendas', value: 'Resends a message with a specified name using a webhook.\n (Being set as owner removes the bottom message)', inline: false }
        ];

        let status = "not set"

        if (owner.includes(interaction.user.id)) {
            fields.push(
                { name: '/add', value: 'Adds an entry to the database. Usage: `/add <name> <proxy> <description> <color> etc.`', inline: false },
                { name: '/get', value: 'Retrieves entries from the database.', inline: false },
                { name: '/edit', value: 'Edits an entry of the database. Usage: `/edit <name> <field> <value>\nThis is the only way to let other people use your proxy (if the field is "Users")', inline: false },
            )
            status = "set"
        }

        const description = `A personal bot for system utility stuff!\nThis bot requires you to be set as OWNER for some things to function. You are currently ${status} as an owner.\nEverything you see in this embed is what you are able to do.`;

        const helpEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Headspacer')
            .setDescription(description)
            .addFields(fields)
            .setTimestamp();
        if (owner.includes(interaction.user.id)) {
            helpEmbed.setFooter({ text: `User ${interaction.user.username} is OWNER` });
        } else {
            helpEmbed.setFooter({ text: `User ${interaction.user.username} is not OWNER` });
        }

        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    },
};
