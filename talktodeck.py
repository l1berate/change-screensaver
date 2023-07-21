import usb.core
import usb.util
import libusb_package
import click
import io
from PIL import Image


# Example Command: python talktodeck.py change-screensaver C:\Users\whoever\Pictures\test.jpg

# To do: Reverse engineer the starting bytes to correctly generate them for each packet.
#        Seperate the image data into packets of 1024 bytes.

# This script was used while reverse engineering the protocol used by the StreamDeck to change screensavers.
# Turns out, not only the screensaver but all key images are sent to the StreamDeck at the same time.
# The start data contains the proceeding info which I'm guessing is the command to write the image to the StreamDeck,
# the key image coordinates, and the image size. The image data is a jpeg file which is sent through many packets
# following the first 8 bytes. The start data does change between every packet, but the first packet for a new image
# should look pretty similar to the one below.


@click.group()
def cli():
    pass


VENDOR_ID = 0xfd9
PRODUCT_ID = 0x80
# Below is copied from https://github.com/abcminiuser/python-elgato-streamdeck/
KEY_COUNT = 15
KEY_COLS = 5
KEY_ROWS = 3

KEY_PIXEL_WIDTH = 72
KEY_PIXEL_HEIGHT = 72
KEY_IMAGE_FORMAT = "JPEG"
KEY_FLIP = (True, True)
KEY_ROTATION = 0

DECK_TYPE = "Stream Deck Original"
DECK_VISUAL = True

IMAGE_REPORT_LENGTH = 1024
IMAGE_REPORT_HEADER_LENGTH = 8
IMAGE_REPORT_PAYLOAD_LENGTH = IMAGE_REPORT_LENGTH - IMAGE_REPORT_HEADER_LENGTH
# End of copy


@cli.command()
@click.argument('path')
def change_screensaver(path):
    """Change the screensaver to the specified file."""
    if path is None:
        print("Path not specified.")
        exit()

    # find our device
    dev = libusb_package.find(idVendor=VENDOR_ID, idProduct=PRODUCT_ID)

    # was it found?
    if dev is None:
        raise ValueError('Device not found')

    # set the active configuration. With no arguments, the first
    # configuration will be the active one
    dev.set_configuration()

    # Find the interface and endpoint
    interface_number = 0
    endpoint_address = 0x2  # Endpoint 2 with OUT direction
    interface = dev.get_active_configuration()[(0, 0)]

    # Get the endpoint object
    endpoint = usb.util.find_descriptor(interface, custom_match=lambda e: usb.util.endpoint_direction(
        e.bEndpointAddress) == usb.util.ENDPOINT_OUT and e.bEndpointAddress == endpoint_address)

    assert endpoint is not None

    # Access the device
    # Here you can perform various operations with the device,
    # such as reading or writing data to the endpoint

    # Write data to the endpoint
    image = convert_image_to_jpg(path)
    data_array = set_screensaver(image)
    for data in data_array:
        endpoint.write(data)

    # Cleanup and release the device
    usb.util.dispose_resources(dev)


def convert_image_to_jpg(image_path):
    """Convert the image to a JPG file."""
    image = Image.open(image_path)
    image = image.convert('RGB')
    image_bytes = io.BytesIO()
    image.save(image_bytes, format='JPEG')
    return image_bytes.getvalue()


def set_screensaver(image):
    """Set the screensaver to the specified image. Modified from https://github.com/abcminiuser/python-elgato-streamdeck/"""
    device = []

    # Could add blank image like abcminiuser did but will skip for now.
    image = bytes(image)

    page_number = 0
    bytes_remaining = len(image)
    while bytes_remaining > 0:
        this_length = min(bytes_remaining, 1016)
        bytes_sent = page_number * 1016

        """ header = [
            0x02,
            0x09,
            0X08,
            1 if this_length == bytes_remaining else 0,
            page_number & 0xFF,
            page_number >> 8,
            this_length & 0xFF,
            this_length >> 8
        ] """

        header = [
            0x02,
            0x08,
            0X00,
            1 if this_length == bytes_remaining else 0,
            this_length & 0xFF,
            this_length >> 8,
            page_number & 0xFF,
            page_number >> 8
        ]

        payload = bytes(header) + image[bytes_sent:bytes_sent + this_length]
        padding = bytearray(IMAGE_REPORT_LENGTH - len(payload))
        device.append(payload + padding)

        bytes_remaining = bytes_remaining - this_length
        page_number = page_number + 1

    return device


if __name__ == '__main__':
    cli()
