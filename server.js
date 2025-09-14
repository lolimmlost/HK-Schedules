const express = require('express');
const path = require('path');

const app = express();
const PORT = 4000;

app.use(express.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Serve index.html as the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Export CSV endpoint
app.post('/export-csv', (req, res) => {
    console.log('Received POST to /export-csv with body:', req.body);
    const schedules = req.body.schedules;
    if (!Array.isArray(schedules) || schedules.length === 0) {
        console.log('Invalid schedules, sending 400');
        return res.status(400).json({ error: 'No schedules provided' });
    }

    console.log('Generating CSV for', schedules.length, 'schedules');
    const headers = ['Name', 'Date', 'Start', 'End', 'Tasks'];
    const csvRows = [
        headers.join(','),
        ...schedules.map(entry => [
            entry.name.replace(/"/g, ''),
            (entry.date || '').replace(/"/g, ''),
            entry.start.replace(/"/g, ''),
            entry.end.replace(/"/g, ''),
            entry.tasks.replace(/"/g, '').replace(/,/g, ';') // Replace commas in tasks with semicolons
        ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    console.log('Sending CSV response');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="housekeeper-schedules.csv"');
    res.send(csvContent);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});