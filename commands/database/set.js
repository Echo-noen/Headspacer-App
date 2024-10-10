const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');
const dbPath = path.resolve(__dirname, '../../database.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set')
        .setDescription('Set attributes for your account.')
        .addStringOption(option =>
            option.setName('field')
                .setDescription('The field to set (e.g., tag)')
                .setRequired(true)
                .addChoices(
                    { name: 'Tag', value: 'tag' }
                ))
        .addStringOption(option =>
            option.setName('value')
                .setDescription('The new value for the specified field')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
            const field = interaction.options.getString('field');
            const value = interaction.options.getString('value');
            const userId = interaction.user.id;

            console.log(`Executing /set command for user: ${userId} with field: ${field} and value: "${value}"`);

            if (field === 'tag') {
                if (value === 'clear') {
                    const userEntry = db.users.find(user => user.account === userId);
                    if (userEntry) {
                        userEntry.tag = '';
                    }

                    await interaction.reply({ 
                        content: 'Your tag has been removed.', 
                        ephemeral: true 
                    });

                    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                    return;
                }

                const textCount = (value.match(/text/g) || []).length;

                if (textCount !== 1) {
                    await interaction.reply({ 
                        content: 'Your tag must contain the word "text" exactly once.', 
                        ephemeral: true 
                    });
                    return;
                }

                const userEntry = db.users.find(user => user.account === userId);
                if (userEntry) {
                    userEntry.tag = value;
                } else {
                    db.users.push({ account: userId, tag: value });
                }
            }

            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
            await interaction.reply({ content: `Your tag has been set to "${value}".`, ephemeral: true });
        } catch (error) {
            console.error('Error in /set command execution:', error);
            await interaction.reply({ content: 'There was an error processing your request. Please try again later.', ephemeral: true });
        }
    },
};
