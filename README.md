# change-screensaver
A couple of python scripts I wrote quickly for personal use, ***not meant for public use!***

## changess.py
This script will change the screensaver in the StreamDeck Assets directory to the specified file.
The file path and name must be added to the JSON file before it can be used. `JSON_FILE` and `PNG_DIRECTORY`
must be changed to the correct paths for your system. Full path name was used for json file because
`changess.bat` was used to run the script globally. This script could be used with other filetypes other
than jpeg, but the `replace_png_files` function would need to be slightly changed I think.

### How to Use - changess.py
Clone repo and replace file_paths.json with the following-
```
{}
```
Open changess.py and modify JSON_FILE and PNG_DIRECTORY to the correct paths for your system.
```
JSON_FILE = "C:\\PATH_TO_CHANGE_SCREENSAVER\\change-screensaver\\file_paths.json"
```
```
PNG_DIRECTORY = "C:\\Users\\YOUR_USERNAME\\AppData\\Roaming\\Elgato\\StreamDeck\\Assets"
```
Save and exit.

Now you can add names and paths of your png files.

### Example commands
Add name/path
```
python changess.py add blue "C:\path\to\your\file.png"
```
Remove name/path
```
python changess.py remove blue
```
List names/paths
```
python changess.py list
```
Replace the Screensaver Image
```
python changess.py replace blue
```
## Notes
- ### Run from anywhere
If you modify the changess.bat with the correct path and make sure it's in your %PATH%, then you can run it from anywhere like so-
```
changess list
```
- ### The picture looks squished or stretched! How do I fix it?
The StreamDeck uses a 480px by 272px jpeg image for screensavers. As long as you provide a png, jpeg, or etc. with the correct dimensions, 
the StreamDeck software will handle converting the image to jpeg and the resizing won't distort your image.
- ### I ran the code, but it didn't update the screensaver on my StreamDeck immediately?
Currently, this method relies on Elgato's software to update the screensaver for us.
So far, I've found this happens whenever the device sleeps and then wakes up or in other words, when the StreamDeck software redraws
all the images for the keys. You might have luck finding some way to trigger that change without pressing a sleep button twice, and if
so, please let me know! I've been working on reverse engineering the code to do so immediately in talktodeck.py, but it'll take some
time before I figure it out.
- ### How do I make this code run when I press a key on my StreamDeck?
If you use Advanced Launcher by BarRaider in the StreamDeck Plug-Ins Store, you can just provide the path to the changess.bat, provide the 
correct arguments, ie. ```replace blue```, and then check the ```Run in background (Experimental)``` box. 

---
## talktodeck.py
### ***Currently Not Working, I'm using this readme to keep track of my progress***
This script was used while reverse engineering the protocol used by the StreamDeck to change screensavers.
Turns out, not only the screensaver but all key images are sent to the StreamDeck at the same time.
The start data contains the proceeding info which I'm guessing is the command to write the images to the StreamDeck,
the key image coordinates, and the image size. The starting data always seems to be 8 bytes long so far but further research is needed.
The image data is a jpeg file which is sent through usually 5 or so packets following the first 8 bytes. The start data does change between 
every packet, but the first packet for a new image should look pretty similar to the one below.
### Example Command
```
python talktodeck.py change-screensaver C:\whoever\Pictures\test.jpg
```
### To-Do List
- [ ] Reverse engineer the starting bytes to correctly generate them for each packet.
- [ ] Seperate the image data into packets of 1024 bytes.
- [ ] Research https://github.com/abcminiuser/python-elgato-streamdeck since all keys must be written when providing a screensaver.
---
## pcaptopic.py
***Not meant for public use, use at your own risk***
This script takes a json file containing raw usb data captures of the StreamDeck from Wireshark and converts it into jpeg files.
The script looks for data going to the StreamDeck that is in the format of a jpeg file and then saves those files.
Since it was used to reverse engineer the protocol used by the StreamDeck to change screensavers, it currently ignores the first 8 bytes
while looking for the magic bytes of a jpeg.
Turns out, not only the screensaver but all key images are sent to the StreamDeck at the same time, so usually this results in 26 images.
The jpeg files will work and show the correct images, but please note that the some files may have extra data attached.
### Example Command
```
python pcaptopic.py convert C:\Users\whoever\Documents\Wireshark\capture.json
```
It currently outputs jpegs to the same directory in the following format - `capture.json1.jpeg`

