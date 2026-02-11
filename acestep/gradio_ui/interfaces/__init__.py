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
        with gr.Accordion("🛠️ Developer Tools: Explorer, Edit & System", open=False):
            
            # 1. Upload Section
            with gr.Group():
                gr.Markdown("### 🚀 Upload Files")
                upload_zone = gr.File(file_count="multiple", label="Drag & Drop files here")
                upload_btn = gr.Button("Upload to Selected Folder", variant="primary")

            with gr.Row():
                # 2. Visual File Explorer
                explorer = gr.FileExplorer(
                    root_dir=".", 
                    label="Project File System",
                    file_count="single",
                    scale=3
                )
                
                with gr.Column(scale=1):
                    gr.Markdown("### Controls")
                    refresh_btn = gr.Button("🔄 Refresh Explorer")
                    delete_btn = gr.Button("🗑️ Delete Selected", variant="stop")
                    git_btn = gr.Button("⚙️ Git Reset & Fetch", variant="secondary")

            # 3. Rename & Create Folder Section (The missing part!)
            with gr.Row():
                with gr.Column():
                    new_name_input = gr.Textbox(placeholder="New name (e.g. song1.flac)", label="Rename Selected Item")
                    rename_btn = gr.Button("✏️ Rename")
                with gr.Column():
                    new_folder_input = gr.Textbox(placeholder="New folder name", label="Create New Folder")
                    make_folder_btn = gr.Button("📁 Create Folder")

            # 4. File Editor Section
            with gr.Group():
                gr.Markdown("### 📝 File Editor")
                code_editor = gr.Code(label="Code / Text Editor", language="markdown", lines=20)
                save_btn = gr.Button("💾 Save Changes", variant="primary")
            
            status_msg = gr.Textbox(label="System Status Log", interactive=False)

            # --- Backend Logic ---
            def load_from_explorer(selected_file):
                if not selected_file: return gr.update(value="", language="markdown")
                path = selected_file[0] if isinstance(selected_file, list) else selected_file
                if os.path.isdir(path): return gr.update(value=f"# Directory: {path}\nSelect a file to edit.", language="markdown")
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    ext = os.path.splitext(path)[1].lower()
                    lang_map = {".json": "json", ".py": "python", ".yaml": "yaml"}
                    return gr.update(value=content, language=lang_map.get(ext, "markdown"))
                except Exception as e: return gr.update(value=f"Error: {str(e)}", language="markdown")

            def create_new_folder(selected_path, folder_name):
                if not folder_name: return "Please enter a folder name."
                # If a folder is selected, create inside it. Otherwise, create in root.
                base_dir = selected_path[0] if selected_path else "."
                if os.path.isfile(base_dir): base_dir = os.path.dirname(base_dir)
                
                new_path = os.path.join(base_dir, folder_name.replace(" ", "_"))
                try:
                    os.makedirs(new_path, exist_ok=True)
                    return f"Folder created: {new_path}"
                except Exception as e: return f"Error: {str(e)}"

            def rename_item(selected_path, new_name):
                if not selected_path or not new_name: return "Select an item and enter a name."
                old_path = selected_path[0] if isinstance(selected_path, list) else selected_path
                new_path = os.path.join(os.path.dirname(old_path), new_name.replace(" ", "_"))
                try:
                    os.rename(old_path, new_path)
                    return f"Renamed to {new_name}"
                except Exception as e: return f"Error: {str(e)}"

            def handle_upload(files, selected_path):
                if not files: return "No files selected."
                target_dir = selected_path[0] if selected_path else "./my_audio"
                if os.path.isfile(target_dir): target_dir = os.path.dirname(target_dir)
                os.makedirs(target_dir, exist_ok=True)
                for f in files:
                    clean_name = os.path.basename(f.name).replace(" ", "_")
                    shutil.copy(f.name, os.path.join(target_dir, clean_name))
                return f"Uploaded to: {target_dir}"

            def delete_item(selected_path):
                if not selected_path: return "Select something to delete."
                path = selected_path[0] if isinstance(selected_path, list) else selected_path
                try:
                    if os.path.isdir(path): shutil.rmtree(path)
                    else: os.remove(path)
                    return f"Deleted: {path}"
                except Exception as e: return f"Error: {str(e)}"

            def save_to_explorer(selected_file, content):
                if not selected_file: return "No file selected!"
                path = selected_file[0] if isinstance(selected_file, list) else selected_file
                try:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    return f"Saved: {os.path.basename(path)}"
                except Exception as e: return f"Error: {str(e)}"

            # --- Event Handlers ---
            explorer.change(load_from_explorer, explorer, code_editor)
            make_folder_btn.click(create_new_folder, [explorer, new_folder_input], status_msg).then(lambda: gr.update(), None, explorer)
            rename_btn.click(rename_item, [explorer, new_name_input], status_msg).then(lambda: gr.update(), None, explorer)
            upload_btn.click(handle_upload, [upload_zone, explorer], status_msg).then(lambda: gr.update(), None, explorer)
            save_btn.click(save_to_explorer, [explorer, code_editor], status_msg)
            delete_btn.click(delete_item, explorer, status_msg).then(lambda: gr.update(), None, explorer)
            refresh_btn.click(lambda: gr.update(), None, explorer)
            git_btn.click(lambda: subprocess.run("git fetch --all && git reset --hard origin/main", shell=True) or "System Updated", None, status_msg)
        
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
