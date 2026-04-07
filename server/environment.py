from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from enum import Enum
import random

class ServiceStatus(str, Enum):
    RUNNING = "RUNNING"
    ERROR = "ERROR"
    OFFLINE = "OFFLINE"

class ServiceState(BaseModel):
    name: str
    status: ServiceStatus
    cpu_load: float = Field(ge=0, le=100)
    memory_usage: float = Field(ge=0)
    is_zombie: bool = False  # Special flag for task 2

class EnvironmentState(BaseModel):
    services: List[ServiceState]
    logs_cleared: List[str] = []
    task_id: int = 0

class ActionType(str, Enum):
    RESTART = "restart_service"
    KILL = "kill_process"
    CLEAR_LOGS = "clear_logs"

class Action(BaseModel):
    type: ActionType
    target: str
    params: Optional[Dict] = None

class OpenEnv:
    def __init__(self):
        self.task_id = 0
        self.services = {}
        self.logs_cleared = []
        self.reset()

    def reset(self, task_id: int = 0) -> EnvironmentState:
        """Resets the environment with specific task scenarios."""
        self.task_id = task_id
        self.logs_cleared = []
        
        # Default Healthy State
        self.services = {
            "API": ServiceState(name="API", status=ServiceStatus.RUNNING, cpu_load=20.0, memory_usage=120.0),
            "DB": ServiceState(name="DB", status=ServiceStatus.RUNNING, cpu_load=15.0, memory_usage=512.0),
            "Auth": ServiceState(name="Auth", status=ServiceStatus.RUNNING, cpu_load=10.0, memory_usage=80.0)
        }

        if task_id == 1:  # Easy: Service Down
            self.services["API"].status = ServiceStatus.OFFLINE
            self.services["API"].cpu_load = 0.0

        elif task_id == 2:  # Medium: Zombie Process
            self.services["DB"].status = ServiceStatus.ERROR
            self.services["DB"].cpu_load = 95.0
            self.services["DB"].is_zombie = True  # Must be killed first

        elif task_id == 3:  # Hard: Cascading Failure
            self.services["Auth"].status = ServiceStatus.OFFLINE
            self.services["Auth"].cpu_load = 0.0
            # Cascading effect: API error because Auth is down
            self.services["API"].status = ServiceStatus.ERROR
            self.services["API"].cpu_load = 40.0

        return self.state()

    def state(self) -> EnvironmentState:
        return EnvironmentState(
            services=list(self.services.values()),
            logs_cleared=self.logs_cleared,
            task_id=self.task_id
        )

    def step(self, action: Action) -> Dict:
        """Executes an action and returns the new state and reward."""
        target_name = action.target
        
        if action.type == ActionType.RESTART:
            if target_name in self.services:
                service = self.services[target_name]
                if service.is_zombie:
                    # Can't restart a zombie!
                    pass 
                else:
                    service.status = ServiceStatus.RUNNING
                    service.cpu_load = random.uniform(5, 20)

        elif action.type == ActionType.KILL:
            if target_name in self.services:
                service = self.services[target_name]
                service.status = ServiceStatus.OFFLINE
                service.cpu_load = 0.0
                service.is_zombie = False  # Process cleared

        elif action.type == ActionType.CLEAR_LOGS:
            if target_name not in self.logs_cleared:
                self.logs_cleared.append(target_name)

        # Update Cascading Logic for Task 3
        if self.task_id == 3:
            # If Auth is fixed, API can recover (simulated recovery)
            if self.services["Auth"].status == ServiceStatus.RUNNING:
                 if self.services["API"].status == ServiceStatus.ERROR:
                     # Recovery logic: if Auth is up, API can be restarted successfully
                     pass 
            else:
                # If Auth is down, API stays in ERROR
                self.services["API"].status = ServiceStatus.ERROR

        reward = self.get_reward()
        return {
            "state": self.state(),
            "reward": reward,
            "done": reward == 1.0
        }

    def get_reward(self) -> float:
        """Calculates reward with partial progress support (0.0 to 1.0)."""
        total_services = len(self.services)
        running_services = sum(1 for s in self.services.values() if s.status == ServiceStatus.RUNNING)
        
        # Partial progress (based on running services)
        base_reward = running_services / total_services
        
        # Penalty for zombies or errors in Task 2
        extra_penalty = 0.0
        if any(s.is_zombie for s in self.services.values()):
            extra_penalty = 0.1

        return round(max(0.0, min(1.0, base_reward - extra_penalty)), 2)

env = OpenEnv()
