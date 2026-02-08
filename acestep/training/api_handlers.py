import threading
import time
import os
import shutil
from typing import Optional, Dict, Any, List
from loguru import logger

from acestep.training.trainer import LoRATrainer
from acestep.training.configs import LoRAConfig, TrainingConfig
from acestep.training.lora_utils import save_lora_weights
from acestep.training.dataset_builder import DatasetBuilder

# Global state
_trainer: Optional[LoRATrainer] = None
_training_thread: Optional[threading.Thread] = None
_training_status: str = "idle"
_training_logs: List[str] = []
_loss_history: List[Dict[str, Any]] = []
_stop_event = threading.Event()

def get_training_status() -> Dict[str, Any]:
    """Get current training status."""
    return {
        "status": _training_status,
        "logs": _training_logs[-20:], # Return last 20 logs
        "loss_history": _loss_history, # Return full loss history for plotting
    }

def stop_training():
    """Signal training to stop."""
    global _trainer, _training_status
    if _trainer:
        _trainer.stop()
    _stop_event.set()
    _training_status = "stopping"
    logger.info("Training stop signal sent")

def export_lora(path: str) -> str:
    """Export the current LoRA weights to a specific path."""
    global _trainer
    
    # Validation
    if not path:
        raise ValueError("Export path is required")
        
    # If we have an active trainer with a model, use it
    if _trainer and _trainer.module:
        save_lora_weights(_trainer.module.model, path)
        return f"Exported current model to {path}"
        
    # If no active trainer, we can't export from memory
    # We could theoretically load from the last checkpoint, but for now let's enforce
    # that this is best used after training or during training.
    # Actually, the user might want to export the result of a previous run.
    # But since we don't persist the trainer across restarts in this simple handler,
    # we'll restrict to "active or recently finished session".
    
    # If there is a "final" output in the default output dir, we could copy it?
    # For now, let's just say "No active model to export" if _trainer is None.
    if _trainer is None:
        raise ValueError("No active training session to export from. Train a model first.")
        
    save_lora_weights(_trainer.module.model, path)
    return f"Exported model to {path}"

def _training_worker(dit_handler, lora_config, training_config):
    global _trainer, _training_status, _training_logs, _loss_history
    
    _training_status = "running"
    _training_logs.append("Initializing trainer...")
    _loss_history.clear()
    
    try:
        # Initialize trainer
        _trainer = LoRATrainer(dit_handler, lora_config, training_config)
        
        # Training loop
        # We need to pass a state dict to allow stopping
        state = {"should_stop": False}
        
        iterator = _trainer.train_from_preprocessed(training_config.tensor_dir, state)
        
        for step, loss, msg in iterator:
            if _stop_event.is_set():
                state["should_stop"] = True
                # The generator will yield one last message and return
            
            # Update logs
            if msg:
                timestamp = time.strftime("%H:%M:%S")
                log_entry = f"[{timestamp}] {msg}"
                _training_logs.append(log_entry)
                # Keep logs manageable
                if len(_training_logs) > 1000:
                    _training_logs = _training_logs[-1000:]
            
            # Update loss history
            if step > 0 and isinstance(loss, (int, float)):
                 _loss_history.append({
                    "step": step,
                    "loss": loss,
                    "timestamp": time.time()
                })

            # Check if we are done (implicit in loop exit, but let's be safe)
            if "Training complete" in msg:
                _training_status = "success"
            elif "Training stopped" in msg:
                _training_status = "stopped"
            elif "Training failed" in msg:
                _training_status = "failed"
                
    except Exception as e:
        logger.exception("Training worker failed")
        _training_status = "failed"
        _training_logs.append(f"Error: {str(e)}")
    finally:
        if _training_status == "running":
             _training_status = "idle" # Should have been set by loop, but fallback
        _stop_event.clear()

def start_training(
    dit_handler,
    base_model_path: str, # Not used directly if dit_handler is provided, but good for config
    output_dir: str,
    tensor_dir: str,
    lora_rank: int = 64,
    lora_alpha: int = 64,
    batch_size: int = 1,
    lr: float = 1e-4,
    epochs: int = 10,
    save_every: int = 1,
    warmup_steps: int = 100,
    gradient_accumulation: int = 4, # Added
    resume_checkpoint: Optional[str] = None, # Added support if we want to pass it
):
    global _training_thread, _stop_event, _training_logs
    
    if _training_status == "running":
        return False, "Training is already running"
        
    # Reset state
    _stop_event.clear()
    _training_logs = ["Starting training..."]
    
    # Configure
    lora_config = LoRAConfig(
        r=lora_rank,
        alpha=lora_alpha,
        dropout=0.05,
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj"], # Default targets
    )
    
    training_config = TrainingConfig(
        output_dir=output_dir,
        tensor_dir=tensor_dir,
        batch_size=batch_size,
        learning_rate=lr,
        max_epochs=epochs,
        save_every_n_epochs=save_every,
        warmup_steps=warmup_steps,
        gradient_accumulation_steps=gradient_accumulation,
    )
    
    # Start thread
    _training_thread = threading.Thread(
        target=_training_worker,
        args=(dit_handler, lora_config, training_config),
        daemon=True
    )
    _training_thread.start()
    
    return True, "Training started"

# Dataset Handlers
_dataset_builder = DatasetBuilder()

def scan_dataset(path: str, name: str, custom_tag: str = "", tag_position: str = "append", all_instrumental: bool = False):
    samples, status = _dataset_builder.scan_directory(path, name, custom_tag, tag_position, all_instrumental)
    return {"samples": [s.to_dict() for s in samples], "count": len(samples), "status": status}

def auto_label_dataset(dit_handler, llm_handler, format_lyrics: bool = False, transcribe_lyrics: bool = False, force_overwrite: bool = False):
    samples, status = _dataset_builder.label_all_samples(
        dit_handler, 
        llm_handler, 
        format_lyrics=format_lyrics, 
        transcribe_lyrics=transcribe_lyrics, 
        only_unlabeled=not force_overwrite
    )
    return {"samples": [s.to_dict() for s in samples], "count": len(samples), "status": status}

def preprocess_dataset(dit_handler, output_dir: str):
    paths, status = _dataset_builder.preprocess_to_tensors(dit_handler, output_dir)
    return {"paths": paths, "count": len(paths), "status": status}

def save_dataset(path: str):
    success, status = _dataset_builder.save_to_json(path)
    return {"success": success, "status": status}

def load_dataset(path: str):
    samples, status = _dataset_builder.load_from_json(path)
    # Get metadata if available
    metadata = {}
    if hasattr(_dataset_builder, 'metadata'):
        metadata = {
            "name": _dataset_builder.metadata.name,
            "custom_tag": _dataset_builder.metadata.custom_tag,
            "tag_position": _dataset_builder.metadata.tag_position,
            "genre_ratio": _dataset_builder.metadata.genre_ratio
        }
    return {"samples": [s.to_dict() for s in samples], "count": len(samples), "status": status, "metadata": metadata}

def update_sample(idx: int, data: dict):
    success, status = _dataset_builder.update_sample(idx, data)
    return {"success": success, "status": status}
