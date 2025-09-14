// Schedule data management
let schedules = JSON.parse(localStorage.getItem('housekeeperSchedules')) || [];
let editingId = null;

// DOM elements
const form = document.getElementById('schedule-form');
const nameInput = document.getElementById('name');
const dateInput = document.getElementById('date');
const startInput = document.getElementById('start');
const endInput = document.getElementById('end');
const tasksInput = document.getElementById('tasks');
const cancelBtn = document.getElementById('cancel-edit');
const importFile = document.getElementById('import-file');
const importBtn = document.getElementById('import-btn');
const printBtn = document.getElementById('print-btn');
const exportBtn = document.getElementById('export-btn');
const tbody = document.getElementById('schedule-body');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app');
    console.log('Export button element:', exportBtn);
    if (!exportBtn) {
        console.error('Export button not found!');
    }
    renderTable();
    form.addEventListener('submit', handleSubmit);
    cancelBtn.addEventListener('click', cancelEdit);
    importBtn.addEventListener('click', handleImport);
    printBtn.addEventListener('click', () => window.print());
    exportBtn.addEventListener('click', () => {
        console.log('Export button click event fired');
        exportToCSV();
    });
});

// Render table
function renderTable() {
    console.log('Rendering table with', schedules.length, 'entries');
    tbody.innerHTML = '';
    schedules.forEach(entry => {
        console.log('Creating row for entry ID:', entry.id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.name}</td>
            <td>${entry.date || 'N/A'}</td>
            <td>${entry.start}</td>
            <td>${entry.end}</td>
            <td>${entry.tasks}</td>
            <td>
                <button class="edit-btn" data-id="${entry.id}">Edit</button>
                <button class="delete-btn" data-id="${entry.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Add event listeners for edit and delete buttons
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            console.log('Edit clicked for ID:', id);
            editEntry(id);
        });
    });
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            console.log('Delete clicked for ID:', id);
            deleteEntry(id);
        });
    });
}

// Handle form submit
function handleSubmit(e) {
    e.preventDefault();
    const entry = {
        id: editingId || Date.now().toString(),
        name: nameInput.value,
        date: dateInput.value || '',
        start: startInput.value,
        end: endInput.value,
        tasks: tasksInput.value
    };

    if (editingId) {
        const index = schedules.findIndex(s => s.id === editingId);
        schedules[index] = entry;
        editingId = null;
        cancelBtn.style.display = 'none';
    } else {
        schedules.push(entry);
    }

    localStorage.setItem('housekeeperSchedules', JSON.stringify(schedules));
    form.reset();
    renderTable();
}

// Edit entry
function editEntry(id) {
    const entry = schedules.find(s => s.id === id);
    if (entry) {
        nameInput.value = entry.name;
        dateInput.value = entry.date || '';
        startInput.value = entry.start;
        endInput.value = entry.end;
        tasksInput.value = entry.tasks;
        editingId = id;
        cancelBtn.style.display = 'inline-block';
    }
}

// Cancel edit
function cancelEdit() {
    editingId = null;
    form.reset();
    cancelBtn.style.display = 'none';
}

// Delete entry
function deleteEntry(id) {
    console.log('deleteEntry called with ID:', id);
    if (confirm('Are you sure you want to delete this schedule?')) {
        schedules = schedules.filter(s => s.id !== id);
        localStorage.setItem('housekeeperSchedules', JSON.stringify(schedules));
        renderTable();
        console.log('Entry deleted, table re-rendered');
    } else {
        console.log('Delete cancelled');
    }
}

// Handle import
function handleImport() {
    const file = importFile.files[0];
    if (!file) {
        alert('Please select a CSV file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.trim().split('\n');
        let importedCount = 0;

        // Simple CSV parser for unquoted fields
        function parseCSVLine(line) {
            return line.split(',').map(field => field.trim().replace(/"/g, ''));
        }

        // Skip header row if present
        let startIndex = 0;
        if (lines.length > 0) {
            const firstLineParts = parseCSVLine(lines[0]);
            if (firstLineParts.length >= 5 &&
                firstLineParts[0].toLowerCase() === 'name' &&
                firstLineParts[2].toLowerCase() === 'start' &&
                firstLineParts[3].toLowerCase() === 'end' &&
                firstLineParts[4].toLowerCase() === 'tasks') {
                startIndex = 1;
                console.log('Detected and skipped header row');
            }
        }

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = parseCSVLine(line);
            if (parts.length >= 4) {
                const name = parts[0];
                const date = parts[1] || '';
                const start = parts[2];
                const end = parts[3];
                const tasks = parts.slice(4).join(', ');

                // Skip if it looks like a header row or is empty
                if (name && start && end && !name.toLowerCase().includes('name')) {
                    schedules.push({
                        id: Date.now().toString() + importedCount++,
                        name,
                        date,
                        start,
                        end,
                        tasks
                    });
                    console.log('Imported clean data:', {name, date, start, end, tasks});
                }
            }
        }

        localStorage.setItem('housekeeperSchedules', JSON.stringify(schedules));
        renderTable();
        importFile.value = '';
        alert(`${importedCount} schedules imported.`);
    };
    reader.readAsText(file);
}

// Export to CSV via server
function exportToCSV() {
    console.log('Export button clicked, starting export...');
    if (schedules.length === 0) {
        console.log('No schedules, showing alert');
        alert('No schedules to export.');
        return;
    }

    console.log('Sending fetch to /export-csv with', schedules.length, 'schedules');
    fetch('/export-csv', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schedules })
    })
    .then(response => {
        console.log('Fetch response status:', response.status);
        if (!response.ok) {
            throw new Error('Export failed');
        }
        return response.blob();
    })
    .then(blob => {
        console.log('Received blob, creating download link');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'housekeeper-schedules.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Download initiated');
    })
    .catch(error => {
        console.error('Export error:', error);
        alert('Failed to export CSV. Please try again.');
    });
}