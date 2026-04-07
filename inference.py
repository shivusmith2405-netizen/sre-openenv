import requests
import time
import json

# Configuration
API_URL = "http://localhost:7860" # Local Docker or Hugging Face Space port

def solve_easy_task():
    print("--- OpenEnv Baseline Inference (Easy Task) ---")
    
    # 1. Reset environmental state with Task ID 1 (Easy)
    print("Step 1: Initializing Task 1 (Easy: Service Down)...")
    res = requests.post(f"{API_URL}/reset?task_id=1")
    state = res.json()
    
    # Analyze the observation space
    api_service = next(s for s in state['services'] if s['name'] == 'API')
    print(f"Observation: {api_service['name']} status is {api_service['status']}.")
    
    # 2. Get current reward
    res_reward = requests.get(f"{API_URL}/reward")
    print(f"Current Health Reward: {res_reward.json()['reward']}")
    
    # 3. Take Action (Step)
    print("\nStep 2: Mock Agent taking action 'restart_service' on 'API'...")
    action = {
        "type": "restart_service",
        "target": "API"
    }
    
    res_step = requests.post(f"{API_URL}/step", json=action)
    result = res_step.json()
    
    # 4. Analyze Outcome
    new_state = result['state']
    new_reward = result['reward']
    api_service_after = next(s for s in new_state['services'] if s['name'] == 'API')
    
    print(f"Observation: {api_service_after['name']} now status is {api_service_after['status']}.")
    print(f"New Health Reward: {new_reward}")
    
    if new_reward == 1.0:
        print("\n[SUCCESS] Task successfully solved! System Health at 100%.")
    else:
        print("\n[FAILURE] Task failed or further steps required.")

if __name__ == "__main__":
    # Wait a moment for server to be ready in Docker environment
    try:
        solve_easy_task()
    except Exception as e:
        print(f"Error during inference: {e}. Is the server running on port 7860?")
