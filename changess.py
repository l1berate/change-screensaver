import json
import click
import os
import shutil
from PIL import Image


"""Example Command: python changess.py replace test.jpg"""
"""Example Command: python changess.py add test C:\Users\whoever\Pictures\test.jpg"""
"""Example Command: python changess.py remove test"""

"""This script will change the screensaver in the StreamDeck Assets directory to the specified file.
   The file path and name must be added to the JSON file before it can be used. JSON_FILE and PNG_DIRECTORY
   must be changed to the correct paths for your system. Full path name was used for json file because
   changess.bat was used to run the script globally. This script could be used with other filetypes other
   than jpeg, but the replace_png_files function would need to be slightly changed I think."""


# JSON file path
JSON_FILE = "C:\\Users\\mrjdw\\source\\repos\\change-screensaver\\file_paths.json"

#Directory path to screenshot png files
PNG_DIRECTORY = "C:\\Users\\mrjdw\\AppData\\Roaming\\Elgato\\StreamDeck\\Assets"

@click.group()
def cli():
    pass


@cli.command()
@click.argument('name')
@click.argument('path')
def add(name, path):
    """Add a file path to the JSON file."""
    file_paths = load_file_paths()
    file_paths[name] = path
    save_file_paths(file_paths)
    print(f"File '{name}' added successfully.")


@cli.command()
@click.argument('name')
def remove(name):
    """Remove a file path from the JSON file."""
    file_paths = load_file_paths()
    if name in file_paths:
        del file_paths[name]
        save_file_paths(file_paths)
        print(f"File '{name}' removed successfully.")
    else:
        print(f"File '{name}' does not exist in the JSON file.")


@cli.command()
def list():
    """List all file paths in the JSON file."""
    file_paths = load_file_paths()
    if file_paths:
        print("File paths:")
        for name, path in file_paths.items():
            print(f"{name}: {path}")
    else:
        print("No file paths found in the JSON file.")

@cli.command()
@click.argument('name')
def replace(name):
    """Replace PNG files in the directory with the specified path."""
    file_paths = load_file_paths()
    if name in file_paths:
        replace_png_files(file_paths[name])
        print(f"PNG files replaced with '{name}'.")
    else:
        print(f"File path '{name}' not found in the JSON file.")


def replace_png_files(path):
    for filename in os.listdir(PNG_DIRECTORY):
        if filename.endswith(".png"):
            file_path = os.path.join(PNG_DIRECTORY, filename)
            shutil.copy(path, file_path)
            resize_image(file_path)
            print(f"Replaced '{filename}' with the specified path.")


def resize_image(file_path):
    desired_width = 480
    desired_height = 272

    image = Image.open(file_path)
    resized_image = image.resize((desired_width, desired_height), Image.Resampling.LANCZOS)
    resized_image.save(file_path)


def load_file_paths():
    try:
        with open(JSON_FILE) as f:
            file_paths = json.load(f)
    except FileNotFoundError:
        file_paths = {}
    return file_paths


def save_file_paths(file_paths):
    with open(JSON_FILE, 'w') as f:
        json.dump(file_paths, f, indent=4)


if __name__ == '__main__':
    cli()
