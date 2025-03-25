async function loadJSON(filePath) {
    const response = await fetch(filePath);
    if (!response.ok) {
        console.error("Could not load or parse JSON:", error);
        return null;
    }
    return await response.json();
}

async function loadCSV(filePath) {
    try {
        const response = await fetch(filePath);
        const csvData = await response.text();
        return parseCSV(csvData);
    } catch (error) {
        console.error("Error loading CSV:", error);
        return {};
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
        return {};
    }

    const headers = lines[0].split(',').map(header => header.trim());
    const data = {};

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        let inQuotes = false;
        let currentValue = '';

        for (let k = 0; k < line.length; k++) {
            const char = line[k];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim()); // Push the last value

        if (values.length === headers.length) {
            const entry = {};
            for (let j = 0; j < headers.length; j++) {
                entry[headers[j]] = values[j];
            }
            data[entry.ID] = entry;
        } else {
            console.warn(`Skipping row ${i + 1} due to inconsistent number of columns.`);
        }
    }

    return data;
}