import json
import click


# Example Command: python pcaptopic.py convert C:\Users\whoever\Documents\Wireshark\capture.json

# This script takes a json file containing raw usb data captures from Wireshark and converts it into jpeg files.
# The script assumes that the data is going to a StreamDeck and that the data is in the format of a jpeg file.
# It was used to reverse engineer the protocol used by the StreamDeck to change screensavers.
# Turns out, not only the screensaver but all key images are sent to the StreamDeck at the same time.
# The jpeg files will work and show the correct images, but please note that the some files will have extra data attached.


@click.group()
def cli():
    pass


@cli.command()
@click.argument('path')
def convert(path):
    # Try to load the JSON file
    try:
        with open(path) as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"File at '{path}' not found.")
        exit()

    # Cycle through the JSON file and create a list of every field called usbhid.data_raw
    capdata_raw = []
    file_number = 0
    output_path = []
    for packet in data:
        if 'usbhid.data_raw' in packet['_source']['layers']:
            if packet['_source']['layers']['usbhid.data_raw'][0][16:24] == "ffd8ffe0":
                if file_number == 0:
                    file_number += 1
                else:
                    output_path.append(path + f'{file_number}.jpeg')
                    convert_and_write(capdata_raw, output_path[file_number-1])
                    file_number += 1
                    capdata_raw = []

            capdata_raw.append(
                packet['_source']['layers']['usbhid.data_raw'][0])

    for i in output_path:
        print(f"File written to '{i}'.")


def convert_and_write(data, output_path):
    # Convert the list of hex strings to a list of bytes
    capdata_raw_bytes = []
    for hex_string in data:
        capdata_raw_bytes.append(bytes.fromhex(hex_string[16:]))

    # Write the bytes to a file
    with open(output_path, 'wb') as f:
        for byte in capdata_raw_bytes:
            f.write(byte)


if __name__ == '__main__':
    cli()
