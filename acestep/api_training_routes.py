from fastapi import APIRouter, Request, Header, HTTPException, Depends
from typing import Optional, List, Dict, Any
import os
import json
import asyncio
from loguru import logger

from acestep.training.api_handlers import (
    start_training, 
    stop_training, 
    get_training_status, 
    export_lora,
    scan_dataset,
    auto_label_dataset,
    preprocess_dataset,
    save_dataset,
    load_dataset,
    update_sample
)

router = APIRouter()

def _wrap_response(data: Any, code: int = 200, error: Optional[str] = None) -> Dict[str, Any]:
    import time
    return {
        "data": data,
        "code": code,
        "error": error,
        "timestamp": int(time.time() * 1000),
    }

@router.get("/v1/training/status")
async def api_training_status(authorization: Optional[str] = Header(None)):
    """Get training status logs"""
    status = get_training_status()
    return _wrap_response(status)

@router.post("/v1/training/scan")
async def api_scan_dataset(request: Request, authorization: Optional[str] = Header(None)):
    """Scan directory for audio files"""
    try:
        body = await request.json()
    except Exception:
        body = {}
    
    path = body.get("path", "")
    if not path:
        return _wrap_response(None, code=400, error="Path is required")
    
    try:
        data = scan_dataset(
            path=path,
            name=body.get("name", "new_dataset"),
            custom_tag=body.get("custom_tag", ""),
            tag_position=body.get("tag_position", "append"),
            all_instrumental=body.get("all_instrumental", False)
        )
        return _wrap_response(data)
    except Exception as e:
        return _wrap_response(None, code=500, error=str(e))

@router.post("/v1/training/autolabel")
async def api_auto_label(request: Request, authorization: Optional[str] = Header(None)):
    """Auto-label dataset using LLM/DiT"""
    try:
        body = await request.json()
    except Exception:
        body = {}
    
    # Verify we have handlers available in app state
    # We need to access the app object.
    # We can get it via request.app
    
    if not hasattr(request.app.state, "handler") or not hasattr(request.app.state, "llm_handler"):
         return _wrap_response(None, code=503, error="Models not initialized")

    dit_handler = request.app.state.handler
    llm_handler = request.app.state.llm_handler

    format_lyrics = body.get("format_lyrics", False)
    transcribe_lyrics = body.get("transcribe_lyrics", False)
    force_overwrite = body.get("force_overwrite", False)

    # Use builder directly
    # Note: label_all_samples is synchronous and might block. 
    # Ideally should be async or threaded.
    # For now, we'll run it and hope it's fast enough or the user waits.
    # Actually, for large datasets this will timeout.
    # It should ideally be a job. But the UI expects a response.
    # Let's run it in a threadpool if possible, or just run it.
    
    try:
        data = await asyncio.to_thread(
            auto_label_dataset,
            dit_handler=dit_handler,
            llm_handler=llm_handler,
            format_lyrics=format_lyrics,
            transcribe_lyrics=transcribe_lyrics,
            force_overwrite=force_overwrite
        )
        return _wrap_response(data)
    except Exception as e:
        return _wrap_response(None, code=500, error=str(e))

@router.post("/v1/training/preprocess")
async def api_preprocess(request: Request, authorization: Optional[str] = Header(None)):
    """Preprocess dataset into tensors"""
    try:
        body = await request.json()
    except Exception:
        body = {}
        
    output_dir = body.get("output_dir", "")
    if not output_dir:
        return _wrap_response(None, code=400, error="Output directory is required")
        
    if not hasattr(request.app.state, "handler"):
         return _wrap_response(None, code=503, error="Model not initialized")
         
    dit_handler = request.app.state.handler
    
    try:
        # Run in thread
        data = await asyncio.to_thread(
            preprocess_dataset,
            dit_handler=dit_handler,
            output_dir=output_dir
        )
        return _wrap_response(data)
    except Exception as e:
        return _wrap_response(None, code=500, error=str(e))

@router.post("/v1/training/train")
async def api_train(request: Request, authorization: Optional[str] = Header(None)):
    """Start training"""
    try:
        body = await request.json()
    except Exception:
        body = {}
        
    if not hasattr(request.app.state, "handler"):
         return _wrap_response(None, code=503, error="Model not initialized")
    
    dit_handler = request.app.state.handler
    
    # Extract params
    tensor_dir = body.get("tensor_dir", "")
    output_dir = body.get("output_dir", "")
    epochs = int(body.get("epochs", 10))
    batch_size = int(body.get("batch_size", 1))
    lr = float(body.get("lr", 1e-4))
    rank = int(body.get("rank", 64))
    alpha = int(body.get("alpha", 64))
    save_every = int(body.get("save_every", 1))
    accumulate = int(body.get("gradient_accumulation", 4))
    
    if not tensor_dir or not output_dir:
        return _wrap_response(None, code=400, error="Tensor dir and output dir are required")
        
    success, msg = start_training(
        dit_handler=dit_handler,
        base_model_path="", # Not needed if handler is passed
        output_dir=output_dir,
        tensor_dir=tensor_dir,
        lora_rank=rank,
        lora_alpha=alpha,
        batch_size=batch_size,
        lr=lr,
        epochs=epochs,
        save_every=save_every,
        gradient_accumulation=accumulate
    )
    
    if success:
        return _wrap_response({"status": msg})
    else:
        return _wrap_response(None, code=409, error=msg)

@router.post("/v1/training/stop")
async def api_stop_training(authorization: Optional[str] = Header(None)):
    stop_training()
    return _wrap_response({"status": "Stopping..."})

@router.post("/v1/training/save")
async def api_save_dataset(request: Request, authorization: Optional[str] = Header(None)):
    try:
        body = await request.json()
    except Exception:
        body = {}
    path = body.get("path", "")
    if not path:
        return _wrap_response(None, code=400, error="Path is required")
    try:
        data = save_dataset(path)
        return _wrap_response(data)
    except Exception as e:
        return _wrap_response(None, code=500, error=str(e))

@router.post("/v1/training/load")
async def api_load_dataset(request: Request, authorization: Optional[str] = Header(None)):
    try:
        body = await request.json()
    except Exception:
        body = {}
    path = body.get("path", "")
    if not path:
        return _wrap_response(None, code=400, error="Path is required")
    try:
        data = load_dataset(path)
        return _wrap_response(data)
    except Exception as e:
        return _wrap_response(None, code=500, error=str(e))

@router.post("/v1/training/export")
async def api_export_lora(request: Request, authorization: Optional[str] = Header(None)):
    try:
        body = await request.json()
    except Exception:
        body = {}
    path = body.get("path", "")
    if not path:
        return _wrap_response(None, code=400, error="Export path is required")
    try:
        msg = export_lora(path)
        return _wrap_response({"status": msg})
    except Exception as e:
        return _wrap_response(None, code=500, error=str(e))

@router.put("/v1/training/sample/{idx}")
async def api_update_sample(idx: int, request: Request, authorization: Optional[str] = Header(None)):
    try:
        body = await request.json()
    except Exception:
        body = {}
    try:
        data = update_sample(idx, body)
        return _wrap_response(data)
    except Exception as e:
        return _wrap_response(None, code=500, error=str(e))

# Dataset settings endpoints
@router.post("/v1/dataset/settings")
async def api_update_settings(request: Request, authorization: Optional[str] = Header(None)):
    try:
        body = await request.json()
    except Exception:
        body = {}
    
    _dataset_builder.metadata.custom_tag = body.get("custom_tag", "")
    _dataset_builder.metadata.tag_position = body.get("tag_position", "append")
    _dataset_builder.metadata.is_all_instrumental = body.get("all_instrumental", False)
    
    return _wrap_response({"status": "settings updated"})
