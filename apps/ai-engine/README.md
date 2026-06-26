# TradeMind AI — Python AI Engine

This service hosts the Python FastAPI server that handles deep neural predictions and explanation rules.

---

## 🛠️ Local Environment Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

2. Activate virtual environment:
   *   **Windows (PowerShell):**
       ```powershell
       .\venv\Scripts\Activate.ps1
       ```
   *   **Linux/macOS:**
       ```bash
       source venv/bin/activate
       ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

---

## 🚀 Running locally

```bash
python main.py
```
Or use Uvicorn directly:
```bash
uvicorn main:app --reload --port 8000
```
FastAPI Swagger documentation will be available at `http://localhost:8000/docs`.
