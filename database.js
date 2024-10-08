const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

const readDatabase = () => {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ data: [] }));
    }
    const data = fs.readFileSync(dbPath);
    return JSON.parse(data);
};

const writeDatabase = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

const addEntry = (name, proxy, description, color, avatar, account, users) => {
    const db = readDatabase();
    db.data.push({ name, proxy, description, color, avatar, account, users });
    writeDatabase(db);
};

const getEntries = () => {
    const db = readDatabase();
    return db.data;
};

module.exports = {
    addEntry,
    getEntries,
};
