export function Name() {
  return "StreamDeck V2";
}
export function VendorId() {
  return 0xfd9;
}
export function ProductId() {
  return 0x80;
}
export function Publisher() {
  return "l1berate";
}
export function Size() {
  return [240, 136];
}
export function DefaultPosition() {
  return [0, 0];
}
export function DefaultScale() {
  return 1.333333333333;
}
export function ControllableParameters() {
  return [
    {
      property: "shutdownColor",
      group: "lighting",
      label: "Shutdown Color",
      min: "0",
      max: "360",
      type: "color",
      default: "009bde",
    },
    {
      property: "LightingMode",
      group: "lighting",
      label: "Lighting Mode",
      type: "combobox",
      values: ["Canvas", "Forced"],
      default: "Canvas",
    },
    {
      property: "forcedColor",
      group: "lighting",
      label: "Forced Color",
      min: "0",
      max: "360",
      type: "color",
      default: "009bde",
    },
  ];
}

// An array called vKeys that contains all integers from 0 to 32,640
var vKeys = [...Array(32640).keys()];

// An array called vLedNames that contains the string "Led 1" 32,640 times
var vLedNames = vKeys.map((vKey) => "Led 1");

// An array called vLedPositions that contains multiple arrays of [x, y] coordinates.
// x goes from 0 to 239, y goes from 0 to 135
var vLedPositions = vKeys.map((vKey) => [vKey % 240, Math.floor(vKey / 240)]);

var emptyBigArray = new Uint8Array(480 * 272 * 4);

export function getVKeys() {
  return vKeys;
}

export function LedNames() {
  return vLedNames;
}

export function LedPositions() {
  return vLedPositions;
}

export function getBigArray() {
  return emptyBigArray;
}

export function Initialize() {
  sendPacket();
  return true;
}

export function Type() {
  return "HID";
}

export function Validate(endpoint) {
  return true;
}

export function Render() {
  sendPacket();
}

function grabColors(shutdown = false) {
  const vKeys = getVKeys();
  var rgbdata = getBigArray();

  const iForcedColor = hexToRgb(forcedColor);
  const iShutdownColor = hexToRgb(shutdownColor);

  const colorBuffer = new Uint8Array(4); // Reusable buffer for RGBA values
  var iLedIdx = 0;
  var maxIdx = 480 * 272 * 4;
  for (let i = 0; i < vKeys.length; i++) {
    const iPxX = vLedPositions[i][0];
    const iPxY = vLedPositions[i][1];

    const color = shutdown
      ? iShutdownColor
      : LightingMode === "Forced"
      ? iForcedColor
      : device.color(iPxX, iPxY);

    colorBuffer[0] = color[0];
    colorBuffer[1] = color[1];
    colorBuffer[2] = color[2];
    colorBuffer[3] = 0xff;

    rgbdata.set(colorBuffer, maxIdx - iLedIdx - 4);
    rgbdata.set(colorBuffer, maxIdx - iLedIdx - 8);
    iLedIdx += 8;
    if (iPxY != 0 && iPxX == 0) {
      rgbdata.set(
        rgbdata.slice(maxIdx - iLedIdx, maxIdx - iLedIdx + 480 * 4),
        maxIdx - iLedIdx - 480 * 4
      );
      iLedIdx += 480 * 4;
    }
  }

  return rgbdata;
}

function generateImage() {
  var rgbdata = grabColors();

  var rawImageData = {
    data: rgbdata,
    width: 480,
    height: 272,
  };

  return encode(rawImageData, 25).data;
}

function sendPacket() {
  const data = generateImage();

  let page_number = 0;
  let bytes_remaining = data.length;
  while (bytes_remaining > 0) {
    let this_length = Math.min(bytes_remaining, 1016);
    let bytes_sent = page_number * 1016;

    let header = [
      0x02,
      0x08,
      0x00,
      this_length === bytes_remaining ? 0x01 : 0x00,
      this_length & 0xff,
      this_length >> 8,
      page_number & 0xff,
      page_number >> 8,
    ];

    let payload = new Uint8Array([
      ...header,
      ...data.slice(bytes_sent, bytes_sent + this_length),
    ]);
    let padding = new Uint8Array(1024 - payload.length);
    device.write([...payload, ...padding], 1024);

    bytes_remaining -= this_length;
    page_number += 1;
  }
}

function hexToRgb(hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  let colors = [];
  colors[0] = parseInt(result[1], 16);
  colors[1] = parseInt(result[2], 16);
  colors[2] = parseInt(result[3], 16);

  return colors;
}

export function Shutdown() {
  return true;
}

export function onBrightnessChanged(brightness) {
  let byteArray = new Uint8Array(32);
  byteArray[0] = 0x03;
  byteArray[1] = 0x08;
  byteArray[2] = brightness;
  device.write(byteArray, 32);
}

export function Image() {
  return "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";
}

// jpeg-js library encoder

/*
  Copyright (c) 2008, Adobe Systems Incorporated
  All rights reserved.

  Redistribution and use in source and binary forms, with or without 
  modification, are permitted provided that the following conditions are
  met:

  * Redistributions of source code must retain the above copyright notice, 
    this list of conditions and the following disclaimer.
  
  * Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the 
    documentation and/or other materials provided with the distribution.
  
  * Neither the name of Adobe Systems Incorporated nor the names of its 
    contributors may be used to endorse or promote products derived from 
    this software without specific prior written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
  IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
  THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
  PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR 
  CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
/*
JPEG encoder ported to JavaScript and optimized by Andreas Ritter, www.bytestrom.eu, 11/2009

Basic GUI blocking jpeg encoder
*/

var btoa =
  btoa ||
  function (buf) {
    return Buffer.from(buf).toString("base64");
  };

function JPEGEncoder(quality) {
  var self = this;
  var fround = Math.round;
  var ffloor = Math.floor;
  var YTable = new Array(64);
  var UVTable = new Array(64);
  var fdtbl_Y = new Array(64);
  var fdtbl_UV = new Array(64);
  var YDC_HT;
  var UVDC_HT;
  var YAC_HT;
  var UVAC_HT;

  var bitcode = new Array(65535);
  var category = new Array(65535);
  var outputfDCTQuant = new Array(64);
  var DU = new Array(64);
  var byteout = [];
  var bytenew = 0;
  var bytepos = 7;

  var YDU = new Array(64);
  var UDU = new Array(64);
  var VDU = new Array(64);
  var clt = new Array(256);
  var RGB_YUV_TABLE = new Array(2048);
  var currentQuality;

  var ZigZag = [
    0, 1, 5, 6, 14, 15, 27, 28, 2, 4, 7, 13, 16, 26, 29, 42, 3, 8, 12, 17, 25,
    30, 41, 43, 9, 11, 18, 24, 31, 40, 44, 53, 10, 19, 23, 32, 39, 45, 52, 54,
    20, 22, 33, 38, 46, 51, 55, 60, 21, 34, 37, 47, 50, 56, 59, 61, 35, 36, 48,
    49, 57, 58, 62, 63,
  ];

  var std_dc_luminance_nrcodes = [
    0, 0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
  ];
  var std_dc_luminance_values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  var std_ac_luminance_nrcodes = [
    0, 0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d,
  ];
  var std_ac_luminance_values = [
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
    0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
    0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45,
    0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
    0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3,
    0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6,
    0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
    0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
    0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4,
    0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa,
  ];

  var std_dc_chrominance_nrcodes = [
    0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0,
  ];
  var std_dc_chrominance_values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  var std_ac_chrominance_nrcodes = [
    0, 0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 0x77,
  ];
  var std_ac_chrominance_values = [
    0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21, 0x31, 0x06, 0x12, 0x41,
    0x51, 0x07, 0x61, 0x71, 0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91,
    0xa1, 0xb1, 0xc1, 0x09, 0x23, 0x33, 0x52, 0xf0, 0x15, 0x62, 0x72, 0xd1,
    0x0a, 0x16, 0x24, 0x34, 0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a, 0x26,
    0x27, 0x28, 0x29, 0x2a, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44,
    0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58,
    0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74,
    0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87,
    0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a,
    0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4,
    0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7,
    0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda,
    0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf2, 0xf3, 0xf4,
    0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa,
  ];

  function initQuantTables(sf) {
    var YQT = [
      16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13,
      16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56,
      68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103,
      121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99,
    ];

    for (var i = 0; i < 64; i++) {
      var t = ffloor((YQT[i] * sf + 50) / 100);
      if (t < 1) {
        t = 1;
      } else if (t > 255) {
        t = 255;
      }
      YTable[ZigZag[i]] = t;
    }
    var UVQT = [
      17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26,
      56, 99, 99, 99, 99, 99, 47, 66, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
      99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
      99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
    ];
    for (var j = 0; j < 64; j++) {
      var u = ffloor((UVQT[j] * sf + 50) / 100);
      if (u < 1) {
        u = 1;
      } else if (u > 255) {
        u = 255;
      }
      UVTable[ZigZag[j]] = u;
    }
    var aasf = [
      1.0, 1.387039845, 1.306562965, 1.175875602, 1.0, 0.785694958, 0.5411961,
      0.275899379,
    ];
    var k = 0;
    for (var row = 0; row < 8; row++) {
      for (var col = 0; col < 8; col++) {
        fdtbl_Y[k] = 1.0 / (YTable[ZigZag[k]] * aasf[row] * aasf[col] * 8.0);
        fdtbl_UV[k] = 1.0 / (UVTable[ZigZag[k]] * aasf[row] * aasf[col] * 8.0);
        k++;
      }
    }
  }

  function computeHuffmanTbl(nrcodes, std_table) {
    var codevalue = 0;
    var pos_in_table = 0;
    var HT = new Array();
    for (var k = 1; k <= 16; k++) {
      for (var j = 1; j <= nrcodes[k]; j++) {
        HT[std_table[pos_in_table]] = [];
        HT[std_table[pos_in_table]][0] = codevalue;
        HT[std_table[pos_in_table]][1] = k;
        pos_in_table++;
        codevalue++;
      }
      codevalue *= 2;
    }
    return HT;
  }

  function initHuffmanTbl() {
    YDC_HT = computeHuffmanTbl(
      std_dc_luminance_nrcodes,
      std_dc_luminance_values
    );
    UVDC_HT = computeHuffmanTbl(
      std_dc_chrominance_nrcodes,
      std_dc_chrominance_values
    );
    YAC_HT = computeHuffmanTbl(
      std_ac_luminance_nrcodes,
      std_ac_luminance_values
    );
    UVAC_HT = computeHuffmanTbl(
      std_ac_chrominance_nrcodes,
      std_ac_chrominance_values
    );
  }

  function initCategoryNumber() {
    var nrlower = 1;
    var nrupper = 2;
    for (var cat = 1; cat <= 15; cat++) {
      //Positive numbers
      for (var nr = nrlower; nr < nrupper; nr++) {
        category[32767 + nr] = cat;
        bitcode[32767 + nr] = [];
        bitcode[32767 + nr][1] = cat;
        bitcode[32767 + nr][0] = nr;
      }
      //Negative numbers
      for (var nrneg = -(nrupper - 1); nrneg <= -nrlower; nrneg++) {
        category[32767 + nrneg] = cat;
        bitcode[32767 + nrneg] = [];
        bitcode[32767 + nrneg][1] = cat;
        bitcode[32767 + nrneg][0] = nrupper - 1 + nrneg;
      }
      nrlower <<= 1;
      nrupper <<= 1;
    }
  }

  function initRGBYUVTable() {
    for (var i = 0; i < 256; i++) {
      RGB_YUV_TABLE[i] = 19595 * i;
      RGB_YUV_TABLE[(i + 256) >> 0] = 38470 * i;
      RGB_YUV_TABLE[(i + 512) >> 0] = 7471 * i + 0x8000;
      RGB_YUV_TABLE[(i + 768) >> 0] = -11059 * i;
      RGB_YUV_TABLE[(i + 1024) >> 0] = -21709 * i;
      RGB_YUV_TABLE[(i + 1280) >> 0] = 32768 * i + 0x807fff;
      RGB_YUV_TABLE[(i + 1536) >> 0] = -27439 * i;
      RGB_YUV_TABLE[(i + 1792) >> 0] = -5329 * i;
    }
  }

  // IO functions
  function writeBits(bs) {
    var value = bs[0];
    var posval = bs[1] - 1;
    while (posval >= 0) {
      if (value & (1 << posval)) {
        bytenew |= 1 << bytepos;
      }
      posval--;
      bytepos--;
      if (bytepos < 0) {
        if (bytenew == 0xff) {
          writeByte(0xff);
          writeByte(0);
        } else {
          writeByte(bytenew);
        }
        bytepos = 7;
        bytenew = 0;
      }
    }
  }

  function writeByte(value) {
    //byteout.push(clt[value]); // write char directly instead of converting later
    byteout.push(value);
  }

  function writeWord(value) {
    writeByte((value >> 8) & 0xff);
    writeByte(value & 0xff);
  }

  // DCT & quantization core
  function fDCTQuant(data, fdtbl) {
    var d0, d1, d2, d3, d4, d5, d6, d7;
    /* Pass 1: process rows. */
    var dataOff = 0;
    var i;
    var I8 = 8;
    var I64 = 64;
    for (i = 0; i < I8; ++i) {
      d0 = data[dataOff];
      d1 = data[dataOff + 1];
      d2 = data[dataOff + 2];
      d3 = data[dataOff + 3];
      d4 = data[dataOff + 4];
      d5 = data[dataOff + 5];
      d6 = data[dataOff + 6];
      d7 = data[dataOff + 7];

      var tmp0 = d0 + d7;
      var tmp7 = d0 - d7;
      var tmp1 = d1 + d6;
      var tmp6 = d1 - d6;
      var tmp2 = d2 + d5;
      var tmp5 = d2 - d5;
      var tmp3 = d3 + d4;
      var tmp4 = d3 - d4;

      /* Even part */
      var tmp10 = tmp0 + tmp3; /* phase 2 */
      var tmp13 = tmp0 - tmp3;
      var tmp11 = tmp1 + tmp2;
      var tmp12 = tmp1 - tmp2;

      data[dataOff] = tmp10 + tmp11; /* phase 3 */
      data[dataOff + 4] = tmp10 - tmp11;

      var z1 = (tmp12 + tmp13) * 0.707106781; /* c4 */
      data[dataOff + 2] = tmp13 + z1; /* phase 5 */
      data[dataOff + 6] = tmp13 - z1;

      /* Odd part */
      tmp10 = tmp4 + tmp5; /* phase 2 */
      tmp11 = tmp5 + tmp6;
      tmp12 = tmp6 + tmp7;

      /* The rotator is modified from fig 4-8 to avoid extra negations. */
      var z5 = (tmp10 - tmp12) * 0.382683433; /* c6 */
      var z2 = 0.5411961 * tmp10 + z5; /* c2-c6 */
      var z4 = 1.306562965 * tmp12 + z5; /* c2+c6 */
      var z3 = tmp11 * 0.707106781; /* c4 */

      var z11 = tmp7 + z3; /* phase 5 */
      var z13 = tmp7 - z3;

      data[dataOff + 5] = z13 + z2; /* phase 6 */
      data[dataOff + 3] = z13 - z2;
      data[dataOff + 1] = z11 + z4;
      data[dataOff + 7] = z11 - z4;

      dataOff += 8; /* advance pointer to next row */
    }

    /* Pass 2: process columns. */
    dataOff = 0;
    for (i = 0; i < I8; ++i) {
      d0 = data[dataOff];
      d1 = data[dataOff + 8];
      d2 = data[dataOff + 16];
      d3 = data[dataOff + 24];
      d4 = data[dataOff + 32];
      d5 = data[dataOff + 40];
      d6 = data[dataOff + 48];
      d7 = data[dataOff + 56];

      var tmp0p2 = d0 + d7;
      var tmp7p2 = d0 - d7;
      var tmp1p2 = d1 + d6;
      var tmp6p2 = d1 - d6;
      var tmp2p2 = d2 + d5;
      var tmp5p2 = d2 - d5;
      var tmp3p2 = d3 + d4;
      var tmp4p2 = d3 - d4;

      /* Even part */
      var tmp10p2 = tmp0p2 + tmp3p2; /* phase 2 */
      var tmp13p2 = tmp0p2 - tmp3p2;
      var tmp11p2 = tmp1p2 + tmp2p2;
      var tmp12p2 = tmp1p2 - tmp2p2;

      data[dataOff] = tmp10p2 + tmp11p2; /* phase 3 */
      data[dataOff + 32] = tmp10p2 - tmp11p2;

      var z1p2 = (tmp12p2 + tmp13p2) * 0.707106781; /* c4 */
      data[dataOff + 16] = tmp13p2 + z1p2; /* phase 5 */
      data[dataOff + 48] = tmp13p2 - z1p2;

      /* Odd part */
      tmp10p2 = tmp4p2 + tmp5p2; /* phase 2 */
      tmp11p2 = tmp5p2 + tmp6p2;
      tmp12p2 = tmp6p2 + tmp7p2;

      /* The rotator is modified from fig 4-8 to avoid extra negations. */
      var z5p2 = (tmp10p2 - tmp12p2) * 0.382683433; /* c6 */
      var z2p2 = 0.5411961 * tmp10p2 + z5p2; /* c2-c6 */
      var z4p2 = 1.306562965 * tmp12p2 + z5p2; /* c2+c6 */
      var z3p2 = tmp11p2 * 0.707106781; /* c4 */

      var z11p2 = tmp7p2 + z3p2; /* phase 5 */
      var z13p2 = tmp7p2 - z3p2;

      data[dataOff + 40] = z13p2 + z2p2; /* phase 6 */
      data[dataOff + 24] = z13p2 - z2p2;
      data[dataOff + 8] = z11p2 + z4p2;
      data[dataOff + 56] = z11p2 - z4p2;

      dataOff++; /* advance pointer to next column */
    }

    // Quantize/descale the coefficients
    var fDCTQuant;
    for (i = 0; i < I64; ++i) {
      // Apply the quantization and scaling factor & Round to nearest integer
      fDCTQuant = data[i] * fdtbl[i];
      outputfDCTQuant[i] =
        fDCTQuant > 0.0 ? (fDCTQuant + 0.5) | 0 : (fDCTQuant - 0.5) | 0;
      //outputfDCTQuant[i] = fround(fDCTQuant);
    }
    return outputfDCTQuant;
  }

  function writeAPP0() {
    writeWord(0xffe0); // marker
    writeWord(16); // length
    writeByte(0x4a); // J
    writeByte(0x46); // F
    writeByte(0x49); // I
    writeByte(0x46); // F
    writeByte(0); // = "JFIF",'\0'
    writeByte(1); // versionhi
    writeByte(1); // versionlo
    writeByte(0); // xyunits
    writeWord(1); // xdensity
    writeWord(1); // ydensity
    writeByte(0); // thumbnwidth
    writeByte(0); // thumbnheight
  }

  function writeAPP1(exifBuffer) {
    if (!exifBuffer) return;

    writeWord(0xffe1); // APP1 marker

    if (
      exifBuffer[0] === 0x45 &&
      exifBuffer[1] === 0x78 &&
      exifBuffer[2] === 0x69 &&
      exifBuffer[3] === 0x66
    ) {
      // Buffer already starts with EXIF, just use it directly
      writeWord(exifBuffer.length + 2); // length is buffer + length itself!
    } else {
      // Buffer doesn't start with EXIF, write it for them
      writeWord(exifBuffer.length + 5 + 2); // length is buffer + EXIF\0 + length itself!
      writeByte(0x45); // E
      writeByte(0x78); // X
      writeByte(0x69); // I
      writeByte(0x66); // F
      writeByte(0); // = "EXIF",'\0'
    }

    for (var i = 0; i < exifBuffer.length; i++) {
      writeByte(exifBuffer[i]);
    }
  }

  function writeSOF0(width, height) {
    writeWord(0xffc0); // marker
    writeWord(17); // length, truecolor YUV JPG
    writeByte(8); // precision
    writeWord(height);
    writeWord(width);
    writeByte(3); // nrofcomponents
    writeByte(1); // IdY
    writeByte(0x11); // HVY
    writeByte(0); // QTY
    writeByte(2); // IdU
    writeByte(0x11); // HVU
    writeByte(1); // QTU
    writeByte(3); // IdV
    writeByte(0x11); // HVV
    writeByte(1); // QTV
  }

  function writeDQT() {
    writeWord(0xffdb); // marker
    writeWord(132); // length
    writeByte(0);
    for (var i = 0; i < 64; i++) {
      writeByte(YTable[i]);
    }
    writeByte(1);
    for (var j = 0; j < 64; j++) {
      writeByte(UVTable[j]);
    }
  }

  function writeDHT() {
    writeWord(0xffc4); // marker
    writeWord(0x01a2); // length

    writeByte(0); // HTYDCinfo
    for (var i = 0; i < 16; i++) {
      writeByte(std_dc_luminance_nrcodes[i + 1]);
    }
    for (var j = 0; j <= 11; j++) {
      writeByte(std_dc_luminance_values[j]);
    }

    writeByte(0x10); // HTYACinfo
    for (var k = 0; k < 16; k++) {
      writeByte(std_ac_luminance_nrcodes[k + 1]);
    }
    for (var l = 0; l <= 161; l++) {
      writeByte(std_ac_luminance_values[l]);
    }

    writeByte(1); // HTUDCinfo
    for (var m = 0; m < 16; m++) {
      writeByte(std_dc_chrominance_nrcodes[m + 1]);
    }
    for (var n = 0; n <= 11; n++) {
      writeByte(std_dc_chrominance_values[n]);
    }

    writeByte(0x11); // HTUACinfo
    for (var o = 0; o < 16; o++) {
      writeByte(std_ac_chrominance_nrcodes[o + 1]);
    }
    for (var p = 0; p <= 161; p++) {
      writeByte(std_ac_chrominance_values[p]);
    }
  }

  function writeCOM(comments) {
    if (typeof comments === "undefined" || comments.constructor !== Array)
      return;
    comments.forEach((e) => {
      if (typeof e !== "string") return;
      writeWord(0xfffe); // marker
      var l = e.length;
      writeWord(l + 2); // length itself as well
      var i;
      for (i = 0; i < l; i++) writeByte(e.charCodeAt(i));
    });
  }

  function writeSOS() {
    writeWord(0xffda); // marker
    writeWord(12); // length
    writeByte(3); // nrofcomponents
    writeByte(1); // IdY
    writeByte(0); // HTY
    writeByte(2); // IdU
    writeByte(0x11); // HTU
    writeByte(3); // IdV
    writeByte(0x11); // HTV
    writeByte(0); // Ss
    writeByte(0x3f); // Se
    writeByte(0); // Bf
  }

  function processDU(CDU, fdtbl, DC, HTDC, HTAC) {
    var EOB = HTAC[0x00];
    var M16zeroes = HTAC[0xf0];
    var pos;
    var I16 = 16;
    var I63 = 63;
    var I64 = 64;
    var DU_DCT = fDCTQuant(CDU, fdtbl);
    //ZigZag reorder
    for (var j = 0; j < I64; ++j) {
      DU[ZigZag[j]] = DU_DCT[j];
    }
    var Diff = DU[0] - DC;
    DC = DU[0];
    //Encode DC
    if (Diff == 0) {
      writeBits(HTDC[0]); // Diff might be 0
    } else {
      pos = 32767 + Diff;
      writeBits(HTDC[category[pos]]);
      writeBits(bitcode[pos]);
    }
    //Encode ACs
    var end0pos = 63; // was const... which is crazy
    for (; end0pos > 0 && DU[end0pos] == 0; end0pos--) {}
    //end0pos = first element in reverse order !=0
    if (end0pos == 0) {
      writeBits(EOB);
      return DC;
    }
    var i = 1;
    var lng;
    while (i <= end0pos) {
      var startpos = i;
      for (; DU[i] == 0 && i <= end0pos; ++i) {}
      var nrzeroes = i - startpos;
      if (nrzeroes >= I16) {
        lng = nrzeroes >> 4;
        for (var nrmarker = 1; nrmarker <= lng; ++nrmarker)
          writeBits(M16zeroes);
        nrzeroes = nrzeroes & 0xf;
      }
      pos = 32767 + DU[i];
      writeBits(HTAC[(nrzeroes << 4) + category[pos]]);
      writeBits(bitcode[pos]);
      i++;
    }
    if (end0pos != I63) {
      writeBits(EOB);
    }
    return DC;
  }

  function initCharLookupTable() {
    var sfcc = String.fromCharCode;
    for (var i = 0; i < 256; i++) {
      ///// ACHTUNG // 255
      clt[i] = sfcc(i);
    }
  }

  this.encode = function (
    image,
    quality // image data object
  ) {
    if (quality) setQuality(quality);

    // Initialize bit writer
    byteout = new Array();
    bytenew = 0;
    bytepos = 7;

    // Add JPEG headers
    writeWord(0xffd8); // SOI
    writeAPP0();
    writeCOM(image.comments);
    writeAPP1(image.exifBuffer);
    writeDQT();
    writeSOF0(image.width, image.height);
    writeDHT();
    writeSOS();

    // Encode 8x8 macroblocks
    var DCY = 0;
    var DCU = 0;
    var DCV = 0;

    bytenew = 0;
    bytepos = 7;

    this.encode.displayName = "_encode_";

    var imageData = image.data;
    var width = image.width;
    var height = image.height;

    var quadWidth = width * 4;

    var x,
      y = 0;
    var r, g, b;
    var start, p, col, row, pos;
    while (y < height) {
      x = 0;
      while (x < quadWidth) {
        start = quadWidth * y + x;
        p = start;
        col = -1;
        row = 0;

        for (pos = 0; pos < 64; pos++) {
          row = pos >> 3; // /8
          col = (pos & 7) * 4; // %8
          p = start + row * quadWidth + col;

          if (y + row >= height) {
            // padding bottom
            p -= quadWidth * (y + 1 + row - height);
          }

          if (x + col >= quadWidth) {
            // padding right
            p -= x + col - quadWidth + 4;
          }

          r = imageData[p++];
          g = imageData[p++];
          b = imageData[p++];

          // use lookup table (slightly faster)
          YDU[pos] =
            ((RGB_YUV_TABLE[r] +
              RGB_YUV_TABLE[(g + 256) >> 0] +
              RGB_YUV_TABLE[(b + 512) >> 0]) >>
              16) -
            128;
          UDU[pos] =
            ((RGB_YUV_TABLE[(r + 768) >> 0] +
              RGB_YUV_TABLE[(g + 1024) >> 0] +
              RGB_YUV_TABLE[(b + 1280) >> 0]) >>
              16) -
            128;
          VDU[pos] =
            ((RGB_YUV_TABLE[(r + 1280) >> 0] +
              RGB_YUV_TABLE[(g + 1536) >> 0] +
              RGB_YUV_TABLE[(b + 1792) >> 0]) >>
              16) -
            128;
        }

        DCY = processDU(YDU, fdtbl_Y, DCY, YDC_HT, YAC_HT);
        DCU = processDU(UDU, fdtbl_UV, DCU, UVDC_HT, UVAC_HT);
        DCV = processDU(VDU, fdtbl_UV, DCV, UVDC_HT, UVAC_HT);
        x += 32;
      }
      y += 8;
    }

    ////////////////////////////////////////////////////////////////

    // Do the bit alignment of the EOI marker
    if (bytepos >= 0) {
      var fillbits = [];
      fillbits[1] = bytepos + 1;
      fillbits[0] = (1 << (bytepos + 1)) - 1;
      writeBits(fillbits);
    }

    writeWord(0xffd9); //EOI

    if (typeof module === "undefined") return new Uint8Array(byteout);
    return Buffer.from(byteout);
  };

  function setQuality(quality) {
    if (quality <= 0) {
      quality = 1;
    }
    if (quality > 100) {
      quality = 100;
    }

    if (currentQuality == quality) return; // don't recalc if unchanged

    var sf = 0;
    if (quality < 50) {
      sf = Math.floor(5000 / quality);
    } else {
      sf = Math.floor(200 - quality * 2);
    }

    initQuantTables(sf);
    currentQuality = quality;
    //console.log('Quality set to: '+quality +'%');
  }

  function init() {
    if (!quality) quality = 50;
    // Create tables
    initCharLookupTable();
    initHuffmanTbl();
    initCategoryNumber();
    initRGBYUVTable();

    setQuality(quality);
  }

  init();
}

if (typeof module !== "undefined") {
  module.exports = encode;
} else if (typeof window !== "undefined") {
  window["jpeg-js"] = window["jpeg-js"] || {};
  window["jpeg-js"].encode = encode;
}

function encode(imgData, qu) {
  if (typeof qu === "undefined") qu = 50;
  var encoder = new JPEGEncoder(qu);
  var data = encoder.encode(imgData, qu);
  return {
    data: data,
    width: imgData.width,
    height: imgData.height,
  };
}
