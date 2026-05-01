# ⚡ Adaptive Round Robin Scheduler

An interactive, full-stack CPU scheduling simulator that visualizes the **Adaptive Round Robin** algorithm. Instead of using a fixed time quantum, this scheduler dynamically calculates the quantum for each round based on the remaining burst times of the processes in the ready queue.

## ✨ Features
- **Dynamic Quantum Calculation**: Automatically adjusts the time quantum per round for optimal efficiency and fairness.
- **Interactive Simulator**: Add processes with custom arrival and burst times.
- **Detailed Metrics**: Computes Waiting Time, Turnaround Time, Response Time, CPU Utilization, and Throughput.
- **Gantt Chart Visualization**: A timeline view of the CPU execution.
- **Adaptive Quantum Log**: See exactly what quantum was assigned to each process in every round.
- **Dark/Light Mode**: A beautiful, premium UI that adapts to your preference.

## 🛠️ Tech Stack
- **Frontend**: React (Vite), JavaScript, Vanilla CSS, Tailwind CSS (for config)
- **Backend**: Node.js, Express
- **Core Algorithm**: C program (`scheduler.exe`) spawned by the Node server

## 👥 Group Members
*(Please replace these placeholders with your actual group details)*
- **Member 1 Name** - Registration No: XXXXXX
- **Member 2 Name** - Registration No: XXXXXX
- **Member 3 Name** - Registration No: XXXXXX
- **Member 4 Name** - Registration No: XXXXXX

## 🚀 How to Run Locally

### Prerequisites
- Node.js installed
- Windows OS (the C simulation runs via a compiled `.exe` file)

### 1. Clone the repository
```bash
git clone https://github.com/ShashankPandey304/Adaptive-Round-Robin-Scheduler.git
cd Adaptive-Round-Robin-Scheduler
```

### 2. Start the Backend
The backend runs the C binary to calculate the scheduling results.
```bash
cd backend
npm install
npm start
```
*The backend will run on `http://localhost:3001`.*

### 3. Start the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The frontend will run on `http://localhost:5173`.*

## 🧠 How the Adaptive Algorithm Works
1. **Processes Arrive**: Processes enter the ready queue based on their Arrival Time.
2. **Calculate Quantum**: At the start of each round, the Time Quantum (TQ) is calculated:
   `TQ = ceil(Σ Remaining Burst Times / N)` (where N is the number of processes in the queue).
3. **Execute**: Each process gets CPU time equal to `min(remaining_time, TQ)`.
4. **Recalculate**: After all processes in the queue get a turn, a new round begins and the TQ is recalculated.

## 📄 License
This project is open-source and available under the MIT License.
