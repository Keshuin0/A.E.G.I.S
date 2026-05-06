import pynvml
import time

def get_gpu_telemetry():
    pynvml.nvmlInit()
    device_count = pynvml.nvmlDeviceGetCount()
    
    for i in range(device_count):
        handle = pynvml.nvmlDeviceGetHandleByIndex(i)
        name = pynvml.nvmlDeviceGetName(handle)
        util = pynvml.nvmlDeviceGetUtilizationRates(handle)
        temp = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
        memory = pynvml.nvmlDeviceGetMemoryInfo(handle)
        
        print(f"--- AEGIS Hardware Telemetry ---")
        print(f"Device: {name}")
        print(f"Utilization: GPU {util.gpu}% | Mem {util.memory}%")
        print(f"Temperature: {temp}C")
        print(f"VRAM: {memory.used / 1024**2:.2f}MB / {memory.total / 1024**2:.2f}MB")
    
    pynvml.nvmlShutdown()

if __name__ == "__main__":
    get_gpu_telemetry()