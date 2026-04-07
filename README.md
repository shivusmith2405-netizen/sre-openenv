---
title: Sre Openenv Simulation
emoji: 🛡️
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# 🛡️ Modern SRE OpenEnv

A high-fidelity simulation environment for training AI agents in Site Reliability Engineering (SRE) tasks. This environment simulates a 3-tier cloud service (API, DB, Auth) with dynamic failure modes.

## 🕹️ Interaction API

The environment follows the **OpenEnv** specification. You can interact with it via its REST API:

### 1. `POST /reset?task_id={ID}`
Resets the environment with a specific scenario:
- `1`: Easy (API Down)
- `2`: Medium (DB Zombie)
- `3`: Hard (Cascading Failure)

### 2. `POST /step`
The core of the agentic interaction. It accepts a JSON action command:
```json
{
  "type": "restart_service",
  "target": "API"
}
```

**Supported Actions:**
- `restart_service`: Restarts a service if it's not in a zombie state.
- `kill_process`: Terminates a process (e.g., to clear a zombie).
- `clear_logs`: Simulates log maintenance.

### 3. `GET /state`
Returns the current observability data (Observation Space).

---

## 🏗️ Architecture
- **Backend (FastAPI)**: Implements the `OpenEnv` spec and grading logic.
- **Frontend (React + Three.js)**: A 3D real-time visualizer for SRE monitoring.
- **Grading**: Reward is a floating-point score between `0.0` and `1.0` representing overall "System Health".

---

## 🛠️ Local Execution (Docker)

To run the full environment locally (serving on port 7860):

```bash
docker build -t openenv-sre .
docker run -p 7860:7860 openenv-sre
```

## 📈 Baseline Inference Script
To see a mock agent solve the 'Easy' task, run:
```bash
python baseline_inference.py
```
