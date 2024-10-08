const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('get')
        .setDescription('Retrieves all entries from the database.'),
        
    async execute(interaction) {
        const entries = db.getEntries();
        if (entries.length === 0) {
            return await interaction.reply('No entries found in the database.');
        }

        const response = entries.map((entry) => `${entry.name}: ${entry.proxy}, ${entry.description}, ${entry.color}`).join('\n');
        await interaction.reply(`Entries:\n${response}`);
    },
};
