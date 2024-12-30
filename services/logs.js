const { LocalStorage } = require('node-localstorage');
const localStorage = new LocalStorage('./logs');

const saveLogToLocalStorage = (logData) => {
    const logsKey = 'appLogs';
    const currentLogs = JSON.parse(localStorage.getItem(logsKey)) || [];
    const newLog = {
        nama_table: logData.table_name,
        skip: logData.skip,
        take: logData.take,
        status: logData.status,
        createdAt: logData.createdAt || new Date().toISOString(),
        type: logData.type,
    };
    currentLogs.push(newLog);
    localStorage.setItem(logsKey, JSON.stringify(currentLogs));
}

const getLogsFromLocalStorage = () => {
    const logsKey = 'appLogs';
    const logs = JSON.parse(localStorage.getItem(logsKey)) || [];
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return logs.slice(0, 10);
}


const clearAllLogs = () => {
    const logsKey = 'appLogs';
    localStorage.removeItem(logsKey);
}

module.exports = {
    saveLogToLocalStorage,
    getLogsFromLocalStorage,
    clearAllLogs
}