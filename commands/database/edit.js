const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');
const dbPath = path.resolve(__dirname, '../../database.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edit')
        .setDescription('Edit an entry in the database.')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the proxy entry to edit')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('field')
                .setDescription('The field to edit (name, proxy, description, color, or users)')
                .setRequired(true)
                .addChoices(
                    { name: 'Name', value: 'name' },
                    { name: 'Proxy', value: 'proxy' },
                    { name: 'Description', value: 'description' },
                    { name: 'Color', value: 'color' },
                    { name: 'Users', value: 'users' }
                ))
        .addStringOption(option =>
            option.setName('value')
                .setDescription('The new value for the specified field')
                .setRequired(true)),

    async execute(interaction) {

        const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

        const entryName = interaction.options.getString('name');
        const field = interaction.options.getString('field');
        const newValue = interaction.options.getString('value').trim();

        const entry = db.data.find(entry => entry.name.toLowerCase() === entryName.toLowerCase());

        if (!entry) {
            await interaction.reply({ content: `No entry found with the name "${entryName}".`, ephemeral: true });
            return;
        }

        if (entry.account !== interaction.user.id) {
            await interaction.reply({ content: "You are not allowed to edit this entry.", ephemeral: true });
            return;
        }

        if (!['name', 'proxy', 'description', 'color', 'users'].includes(field)) {
            await interaction.reply({ content: `Invalid field specified. Choose one of the options.`, ephemeral: true });
            return;
        }

        if (field === 'users') {
            const userId = newValue.replace(/<@!?(\d+)>/, '$1').trim();

            if (!/^\d+$/.test(userId)) {
                await interaction.reply({ content: `Please provide a valid user ID to add or remove.`, ephemeral: true });
                return;
            }

            entry.users = entry.users || [];

            if (entry.users.includes(userId)) {
                entry.users = entry.users.filter(id => id !== userId);
                await interaction.reply({ content: `User ID "${userId}" has been removed from "${entryName}".`, ephemeral: true });
            } else {
                entry.users.push(userId);
                await interaction.reply({ content: `User ID "${userId}" has been added to "${entryName}".`, ephemeral: true });
            }

        } else if (field === 'proxy') {
            if (!newValue.includes('text')) {
                return interaction.reply({ content: `The proxy must contain the word "text".`, ephemeral: true });
            }
            entry[field] = newValue;

        } else if (field === 'color') {
            if (!/^#[0-9A-F]{6}$/i.test(newValue)) {
                return interaction.reply({ content: `Error: The color must be a valid HEX code (e.g., #FFFFFF).`, ephemeral: true });
            }
            entry[field] = newValue;

        } else {
            entry[field] = newValue;
        }

        await interaction.reply({ content: `The ${field} of "${entryName}" has been updated to "${newValue}".`, ephemeral: true });

        try {
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        } catch (error) {
            console.error('Error writing to database file:', error);
            await interaction.reply({ content: 'There was an error saving the changes to the database.', ephemeral: true });
        }
    }
};
