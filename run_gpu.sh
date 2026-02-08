#!/bin/bash

# Opt-in to flash-attention-2 for ROCm, this is needed
# until it matures out of "experimental" status.
export TORCH_ROCM_AOTRITON_ENABLE_EXPERIMENTAL=1

export ACESTEP_CONFIG_PATH=acestep-v15-turbo
export ACESTEP_LM_MODEL_PATH=acestep-5Hz-lm-4B
export ACESTEP_INIT_LLM=true
export ACESTEP_API_HOST=0.0.0.0
export ACESTEP_API_PORT=11436

exec nohup uv run acestep-api > /tmp/ace-step.txt 2>&1 &
