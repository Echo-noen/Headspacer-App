const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database.js');
const { owner } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Adds an entry to the database.')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name to add')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('proxy')
                .setDescription('The proxy to add (must include "text")')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('A description of the entry')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('The color of the entry (HEX code)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('avatar')
                .setDescription('Avatar URL for the entry')
                .setRequired(false)),

    async execute(interaction) {

        if (!owner.includes(interaction.user.id)) {
            const linkToPK = "[PluralKit](https://discord.com/oauth2/authorize?client_id=466378653216014359&scope=bot%20applications.commands&permissions=536995904)"
            await interaction.reply({content: `You are not allowed to perform this action. Use ${linkToPK}, or alternatively ask the developer(s).`, ephemeral: true })
            return;
        }

        const name = interaction.options.getString('name');
        const proxy = interaction.options.getString('proxy');
        const description = interaction.options.getString('description');
        const color = interaction.options.getString('color');
        const avatarUrl = interaction.options.getString('avatar');
        const account = interaction.user.id;

        if (!proxy.includes('text')) {
            return interaction.reply({content: 'Error: The proxy must contain the word "text".', ephemeral: true });
        }

        if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
            return interaction.reply({content: 'Error: The color must be a valid HEX code (e.g., #FFFFFF).', ephemeral: true });
        }

        const userAvatar = interaction.user.displayAvatarURL({ dynamic: true });
        const finalAvatarUrl = avatarUrl || userAvatar;

        db.addEntry(name, proxy, description, color, finalAvatarUrl, account);
        await interaction.reply({ content: `${name} added to the database!\n${proxy}, ${description}, ${color}.\nAvatar: ${finalAvatarUrl}`, ephemeral: true });
    },
};
