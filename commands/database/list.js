const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dbPath = path.resolve(__dirname, '../../database.json');
const { token } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('Retrieves all entries from the database the user owns.'),
        
    async execute(interaction) {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

        const entries = db.data.filter(entry =>
            entry.account &&
            (entry.account === interaction.user.id || (Array.isArray(entry.users) && entry.users.includes(interaction.user.id)))
        );

        if (entries.length === 0) {
            return await interaction.reply({ content: 'No entries found in the database.', ephemeral: true });
        }

        const fetchUser = async (id) => {
            const response = await fetch(`https://discord.com/api/v9/users/${id}`, {
                headers: {
                    Authorization: `Bot ${token}`
                }
            });
            if (!response.ok) throw new Error(`Error status code: ${response.status}`);
            return await response.json();
        }

        const embed = new EmbedBuilder()
            .setColor('#8653c9')
            .setTitle('Your Proxy Entries')
            .setDescription('Here are the entries you own or are part of:')
            .setTimestamp();

        await Promise.all(entries.map(async (entry) => {
            const accountUser = await fetchUser(entry.account).catch(err => {
                console.error(err);
                return { username: 'Unknown User' };
            });

            let isOwn = '';
            if (entry.users && entry.users.includes(interaction.user.id) && entry.account !== interaction.user.id) {
                isOwn = `Belongs to ${accountUser.username}`;
            }

            let entryProxy = "`" + entry.proxy + "`";

            embed.addFields({
                name: entry.name,
                value: `Proxy: ${entryProxy}\nDescription: ${entry.description || 'No description'}\nColor: ${entry.color || 'No color'}\n${isOwn}`,
                inline: false
            });
        }));

        await interaction.reply({ embeds: [embed], ephemeral: true});
    },
};
