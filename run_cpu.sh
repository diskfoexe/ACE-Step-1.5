#!/bin/bash

export ACESTEP_LM_OFFLOAD_TO_CPU=true
export ACESTEP_DEVICE=cpu
export ACESTEP_USE_FLASH_ATTENTION=false

export ACESTEP_CONFIG_PATH=acestep-v15-turbo
export ACESTEP_LM_MODEL_PATH=acestep-5Hz-lm-4B
export ACESTEP_INIT_LLM=true
export ACESTEP_API_HOST=0.0.0.0
export ACESTEP_API_PORT=11436

exec nohup uv run acestep-api > /tmp/ace-step.txt 2>&1 &
