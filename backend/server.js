const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/run', (req, res) => {
    const { processes, baseQuantum } = req.body;

    if (!processes || !Array.isArray(processes) || processes.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty processes array.' });
    }

    const bq = (baseQuantum && baseQuantum >= 1) ? baseQuantum : 1;

    // Format: N baseQuantum\npid at bt\n...
    let inputStr = `${processes.length} ${bq}\n`;
    for (const p of processes) {
        inputStr += `${p.id} ${p.at} ${p.bt}\n`;
    }

    const isWindows = process.platform === 'win32';
    const exeName = isWindows ? 'scheduler.exe' : 'scheduler';
    const exePath = path.join(__dirname, '..', 'c-code', exeName);
    const child = spawn(exePath);

    let outputData = '';
    let errorData  = '';

    child.stdout.on('data', (data) => { outputData += data.toString(); });
    child.stderr.on('data', (data) => { errorData  += data.toString(); });

    child.on('close', (code) => {
        if (code !== 0) {
            console.error(`C program exited with code ${code}: ${errorData}`);
            return res.status(500).json({ error: 'Failed to run simulation.' });
        }
        try {
            const result = JSON.parse(outputData);
            res.json(result);
        } catch (err) {
            console.error('Failed to parse output:', outputData);
            res.status(500).json({ error: 'Invalid output from simulation.' });
        }
    });

    child.on('error', (err) => {
        console.error('Failed to start subprocess.', err);
        res.status(500).json({ error: 'Failed to start subprocess.' });
    });

    child.stdin.write(inputStr);
    child.stdin.end();
});

app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});
