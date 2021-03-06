const map = {
  '1C': 0,
  '1Db': 1,
  '1D': 2,
  '1Eb': 3,
  '1E': 4,
  '1F': 5,
  '1Gb': 6,
  '1G': 7,
  '1Ab': 8,
  '1A': 9,
  '1Bb': 10,
  '1B': 11,
  '2C': 12,
  '2Db': 13,
  '2D': 14,
  '2Eb': 15,
  '2E': 16,
  '2F': 17,
  '2Gb': 18,
  '2G': 19,
  '2Ab': 20,
  '2A': 21,
  '2Bb': 22,
  '2B': 23,
  '3C': 24,
  '3Db': 25,
  '3D': 26,
  '3Eb': 27,
  '3E': 28,
  '3F': 29,
  '3Gb': 30,
  '3G': 31,
  '3Ab': 32,
  '3A': 33,
  '3Bb': 34,
  '3B': 35,
  '4C': 36,
  '4Db': 37,
  '4D': 38,
  '4Eb': 39,
  '4E': 40,
  '4F': 41,
  '4Gb': 42,
  '4G': 43,
  '4Ab': 44,
  '4A': 45,
  '4Bb': 46,
  '4B': 47,
  '5C': 48,
  '5Db': 49,
  '5D': 50,
  '5Eb': 51,
  '5E': 52,
  '5F': 53,
  '5Gb': 54,
  '5G': 55,
  '5Ab': 56,
  '5A': 57,
  '5Bb': 58,
  '5B': 59,
  '6C': 60,
  '6Db': 61,
  '6D': 62,
  '6Eb': 63,
  '6E': 64,
  '6F': 65,
  '6Gb': 66,
  '6G': 67,
  '6Ab': 68,
  '6A': 69,
  '6Bb': 70,
  '6B': 71,
  '7C': 72,
  '7Db': 73,
  '7D': 74,
  '7Eb': 75,
  '7E': 76,
  '7F': 77,
  '7Gb': 78,
  '7G': 79,
  '7Ab': 80,
  '7A': 81,
  '7Bb': 82,
  '7B': 83,
  '8C': 84,
  '8Db': 85,
  '8D': 86,
  '8Eb': 87,
  '8E': 88,
  '8F': 89,
  '8Gb': 90,
  '8G': 91,
  '8Ab': 92,
  '8A': 93,
  '8Bb': 94,
  '8B': 95,
  '9C': 96,
  '9Db': 97,
  '9D': 98,
  '9Eb': 99,
  '9E': 100,
  '9F': 101,
  '9Gb': 102,
  '9G': 103,
  '9Ab': 104,
  '9A': 105,
  '9Bb': 106,
  '9B': 107,
  '10C': 108,
  '10Db': 109,
  '10D': 110,
  '10Eb': 111,
  '10E': 112,
  '10F': 113,
  '10Gb': 114,
  '10G': 115,
  '10Ab': 116,
  '10A': 117,
  '10Bb': 118,
  '10B': 119,
  '11C': 120,
  '11Db': 121,
  '11D': 122,
  '11Eb': 123,
  '11E': 124,
  '11F': 125,
  '11Gb': 126,
  '11G': 127,
}

module.exports = function noteToMidiNumber(note) {
  return map.hasOwnProperty(note) ? map[note] : null
}
