import usb.core
import usb.util
import libusb_package
import click
import io
from PIL import Image


"""Example Command: python talktodeck.py change-screensaver C:\Users\whoever\Pictures\test.jpg"""

"""To do: Reverse engineer the starting bytes to correctly generate them for each packet.
          Seperate the image data into packets of 1024 bytes."""

"""This script was used while reverse engineering the protocol used by the StreamDeck to change screensavers.
   Turns out, not only the screensaver but all key images are sent to the StreamDeck at the same time.
   The start data contains the proceeding info which I'm guessing is the command to write the image to the StreamDeck,
   the key image coordinates, and the image size. The image data is a jpeg file which is sent through many packets
   following the first 8 bytes. The start data does change between every packet, but the first packet for a new image
   should look pretty similar to the one below."""


@click.group()
def cli():
    pass


vendor_id = 0xfd9
product_id = 0x80


@cli.command()
@click.argument('path')
def change_screensaver(path):
    """Change the screensaver to the specified file."""
    if path is None:
        print("Path not specified.")
        exit()

    # find our device
    dev = libusb_package.find(idVendor=vendor_id, idProduct=product_id)

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

    # Example: Write data to the endpoint
    start_data = b"\x02\x07\x00\x00\xf8\x03\x00\x00"
    data = convert_image_to_jpg(path)
    endpoint.write(start_data + data)

    # Cleanup and release the device
    usb.util.dispose_resources(dev)


def convert_image_to_jpg(image_path):
    """Convert the image to a JPG file."""
    image = Image.open(image_path)
    image = image.convert('RGB')
    image_bytes = io.BytesIO()
    image.save(image_bytes, format='JPEG')
    return image_bytes.getvalue()


if __name__ == '__main__':
    cli()
