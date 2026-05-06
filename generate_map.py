import os
import json

def map_directory(path):
    # This creates a dictionary representing the folder structure
    tree = {'name': os.path.basename(path), 'type': 'folder', 'children': []}
    
    try:
        items = os.listdir(path)
    except PermissionError:
        return tree # Skip folders you don't have access to

    for item in items:
        item_path = os.path.join(path, item)
        if os.path.isdir(item_path):
            # If it's a folder, run the function again (recursion)
            tree['children'].append(map_directory(item_path))
        else:
            # If it's a file, just add its info
            tree['children'].append({
                'name': item,
                'type': 'file',
                'size_bytes': os.path.getsize(item_path)
            })
    return tree

# --- Execution ---
current_folder = os.getcwd()
data = map_directory(current_folder)

with open('folder_map.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4)

print("JSON map generated: folder_map.json")
