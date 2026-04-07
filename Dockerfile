# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve Backend & Frontend
FROM python:3.9-slim
WORKDIR /app

# Prepare static directory
RUN mkdir -p /app/static

# Install backend dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY backend/ ./backend/
COPY openenv.yaml .
COPY inference.py .

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist/ /app/static/

WORKDIR /app/backend

# Run the project on Hugging Face Spaces port 7860
EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
