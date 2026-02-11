"""
Gradio UI Components Module
Contains all Gradio interface component definitions and layouts
"""
import gradio as gr
from acestep.gradio_ui.i18n import get_i18n, t
from acestep.gradio_ui.interfaces.dataset import create_dataset_section
from acestep.gradio_ui.interfaces.generation import create_generation_section
from acestep.gradio_ui.interfaces.result import create_results_section
from acestep.gradio_ui.interfaces.training import create_training_section
from acestep.gradio_ui.events import setup_event_handlers, setup_training_event_handlers


def create_gradio_interface(dit_handler, llm_handler, dataset_handler, init_params=None, language='en') -> gr.Blocks:
    """
    Create Gradio interface
    
    Args:
        dit_handler: DiT handler instance
        llm_handler: LM handler instance
        dataset_handler: Dataset handler instance
        init_params: Dictionary containing initialization parameters and state.
                    If None, service will not be pre-initialized.
        language: UI language code ('en', 'zh', 'ja', default: 'en')
        
    Returns:
        Gradio Blocks instance
    """
    # Initialize i18n with selected language
    i18n = get_i18n(language)
    
    with gr.Blocks(
        title=t("app.title"),
        theme=gr.themes.Soft(),
        css="""
        .main-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        .section-header {
            background: linear-gradient(90deg, #4CAF50, #45a049);
            color: white;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .lm-hints-row {
            align-items: stretch;
        }
        .lm-hints-col {
            display: flex;
        }
        .lm-hints-col > div {
            flex: 1;
            display: flex;
        }
        .lm-hints-btn button {
            height: 100%;
            width: 100%;
        }
        /* Position Audio time labels lower to avoid scrollbar overlap */
        .component-wrapper > .timestamps {
            transform: translateY(15px);
        }
        """,
    ) as demo:
        
        gr.HTML(f"""
        <div class="main-header">
            <h1>{t("app.title")}</h1>
            <p>{t("app.subtitle")}</p>
        </div>
        """)


        
        # --- ACE-Step Developer Tools (File Explorer, Editor, and Git) ---
        import shutil, os, subprocess
        with gr.Accordion("🛠️ Developer Tools: Explorer & System", open=False):
            
            with gr.Row():
                # Visual File Explorer
                explorer = gr.FileExplorer(
                    root_dir=".", 
                    label="Project File System",
                    file_count="single",
                    scale=3
                )
                
                with gr.Column(scale=1):
                    refresh_btn = gr.Button("🔄 Refresh Explorer")
                    delete_btn = gr.Button("🗑️ Delete Selected", variant="stop")
                    git_update_btn = gr.Button("⚙️ Git Reset & Fetch", variant="secondary")

            # Code Editor Group
            with gr.Group():
                gr.Markdown("### 📝 File Editor")
                code_editor = gr.Code(
                    label="Edit Content (JSON, PY, TXT)", 
                    language="json", 
                    lines=20
                )
                save_btn = gr.Button("💾 Save Changes", variant="primary")
            
            status_msg = gr.Textbox(label="System Status", interactive=False)

            # --- Backend Logic ---

            def load_from_explorer(selected_file):
                if not selected_file:
                    return gr.update(value="", language="markdown")
                path = selected_file[0] if isinstance(selected_file, list) else selected_file
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    ext = os.path.splitext(path)[1].lower()
                    lang_map = {".json": "json", ".py": "python", ".yaml": "yaml"}
                    return gr.update(value=content, language=lang_map.get(ext, "markdown"))
                except Exception as e:
                    return gr.update(value=f"Error: {str(e)}", language="markdown")

            def save_to_explorer(selected_file, content):
                if not selected_file:
                    return "No file selected to save!"
                path = selected_file[0] if isinstance(selected_file, list) else selected_file
                try:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    return f"Successfully saved: {os.path.basename(path)}"
                except Exception as e:
                    return f"Error saving file: {str(e)}"

            def delete_from_explorer(selected_file):
                if not selected_file:
                    return "Select a file or folder in the explorer first."
                path = selected_file[0] if isinstance(selected_file, list) else selected_file
                try:
                    if os.path.isdir(path):
                        shutil.rmtree(path)
                    else:
                        os.remove(path)
                    return f"Deleted: {path}"
                except Exception as e:
                    return f"Error deleting: {str(e)}"

            def run_git_reset():
                try:
                    subprocess.run("git fetch --all && git reset --hard origin/main", shell=True, check=True)
                    return "Repository updated successfully. Please restart the server to apply changes."
                except Exception as e:
                    return f"Git Error: {str(e)}"

            # --- Event Handlers ---
            # Auto-load file when clicked in the Explorer
            explorer.change(load_from_explorer, inputs=explorer, outputs=code_editor)
            
            save_btn.click(save_to_explorer, [explorer, code_editor], status_msg)
            
            delete_btn.click(delete_from_explorer, explorer, status_msg).then(
                lambda: gr.update(), None, explorer
            )
            
            refresh_btn.click(lambda: gr.update(), None, explorer)
            
            git_update_btn.click(run_git_reset, None, status_msg)
        # ------------------------
        
        
        
        # Dataset Explorer Section
        dataset_section = create_dataset_section(dataset_handler)
        
        # Generation Section (pass init_params and language to support pre-initialization)
        generation_section = create_generation_section(dit_handler, llm_handler, init_params=init_params, language=language)
        
        # Results Section
        results_section = create_results_section(dit_handler)
        
        # Training Section (LoRA training and dataset builder)
        # Pass init_params to support hiding in service mode
        training_section = create_training_section(dit_handler, llm_handler, init_params=init_params)
        
        # Connect event handlers
        setup_event_handlers(demo, dit_handler, llm_handler, dataset_handler, dataset_section, generation_section, results_section)
        
        # Connect training event handlers
        setup_training_event_handlers(demo, dit_handler, llm_handler, training_section)
    
    return demo
