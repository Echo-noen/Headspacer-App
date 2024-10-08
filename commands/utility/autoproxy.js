const { SlashCommandBuilder } = require('@discordjs/builders');
const { owner } = require('../../config.json');
const fs = require('fs');
const path = require('path');
const dbPath = path.resolve(__dirname, '../../database.json');

const activeProxies = {};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autoproxy')
        .setDescription('Automatically send messages as a proxy with the specified name.')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the proxy to use')
                .setRequired(false)),


    async execute(interaction) {

        const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

        const isOwner = owner.includes(interaction.user.id);
        const userInProxy = db.data.some(entry => entry.users && entry.users.includes(interaction.user.id));

        if (!isOwner && !userInProxy) return;

        const proxyName = interaction.options.getString('name');

        if (!proxyName) {
            delete activeProxies[interaction.user.id];
            return interaction.reply({ content: "Autoproxy has been disabled.", ephemeral: true });
        }

        const proxyEntry = db.data.find(entry => entry.name.toLowerCase() === proxyName.toLowerCase() && (entry.account === interaction.user.id || (Array.isArray(entry.users) && entry.users.includes(interaction.user.id))));

        if (!proxyEntry) {
            return interaction.reply({ content: `No proxy found with the name "${proxyName}" that you have access to.`, ephemeral: true });
        }

        activeProxies[interaction.user.id] = proxyEntry;

        // console.log(activeProxies);

        await interaction.reply({ content: `Active proxy set to "${proxyEntry.name}". All subsequent messages will be sent as this proxy.`, ephemeral: true });
    }
};

module.exports.activeProxies = activeProxies;