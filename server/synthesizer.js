const WaveShaper = require('./waveshaper')
const Voice = require('./voice')
const noteToMidiNumber = require('./noteToMidiNumber')

class Synthesizer {
  /**
   * Borrowed from https://github.com/cwilso/midi-synth
   */

  constructor() {
    this.voices = []
    this.audioContext = null

    this.currentOctave = 3
    this.modOscFreqMultiplier = 1
    this.moDouble = false
    this.moQuadruple = false

    this.currentPitchWheel = 0.0

    this.waveforms = ['sine', 'square', 'sawtooth', 'triangle']

    // This is the "initial patch"
    this.currentModWaveform = 0	// SINE
    this.currentModFrequency = 2.1 // Hz * 10 = 2.1
    this.currentModOsc1 = 15
    this.currentModOsc2 = 17

    this.currentOsc1Waveform = 2 // SAW
    this.currentOsc1Octave = 0  // 32'
    this.currentOsc1Detune = 0	// 0
    this.currentOsc1Mix = 50.0	// 50%

    this.currentOsc2Waveform = 2 // SAW
    this.currentOsc2Octave = 0  // 16'
    this.currentOsc2Detune = -25	// fat detune makes pretty analogue-y sound.  :)
    this.currentOsc2Mix = 50.0	// 0%

    this.currentFilterCutoff = 8
    this.currentFilterQ = 7.0
    this.currentFilterMod = 21
    this.currentFilterEnv = 56

    this.currentEnvA = 2
    this.currentEnvD = 15
    this.currentEnvS = 68
    this.currentEnvR = 5

    this.currentFilterEnvA = 5
    this.currentFilterEnvD = 6
    this.currentFilterEnvS = 5
    this.currentFilterEnvR = 7

    this.currentDrive = 38
    this.currentRev = 32
    this.currentVol = 75
    // end initial patch

    let keys = new Array(256)
    // Lower row: zsxdcvgbhnjm...
    keys[16] = 41 // = F2
    keys[65] = 42
    keys[90] = 43
    keys[83] = 44
    keys[88] = 45
    keys[68] = 46
    keys[67] = 47
    keys[86] = 48 // = C3
    keys[71] = 49
    keys[66] = 50
    keys[72] = 51
    keys[78] = 52
    keys[77] = 53 // = F3
    keys[75] = 54
    keys[188] = 55
    keys[76] = 56
    keys[190] = 57
    keys[186] = 58
    keys[191] = 59

    // Upper row: q2w3er5t6y7u...
    keys[81] = 60 // = C4 ("middle C")
    keys[50] = 61
    keys[87] = 62
    keys[51] = 63
    keys[69] = 64
    keys[82] = 65 // = F4
    keys[53] = 66
    keys[84] = 67
    keys[54] = 68
    keys[89] = 69
    keys[55] = 70
    keys[85] = 71
    keys[73] = 72 // = C5
    keys[57] = 73
    keys[79] = 74
    keys[48] = 75
    keys[80] = 76
    keys[219] = 77 // = F5
    keys[187] = 78
    keys[221] = 79
    keys[220] = 80

    this.keys = keys

    this.effectChain = null
    this.waveshaper = null
    this.volNode = null
    this.revNode = null
    this.revGain = null
    this.revBypassGain = null
    this.compressor = null

    this.initAudio()
  }

  noteOn(note, velocity) {
    if (!this.voices[note]) {
      // Create a new synth node
      this.voices[note] = new Voice(note, velocity, this)
    }
  }

  noteOff(note) {
    if (this.voices[note]) {
      // Shut off the note playing and clear it
      this.voices[note].noteOff()
      this.voices[note] = null
    }
  }

  // 'value' is normalized to 0..1.
  controller(number, value) {
    switch (number) {
      case 2:
        this.onUpdateFilterCutoff(100 * value)
      return
      case 0x0a:
        case 7:
        this.onUpdateFilterQ(20 * value)
        return
      case 1:
        this.onUpdateFilterMod(100 * value)
        return
      case 0x49:
      case 5:
      case 15:
        this.onUpdateDrive(100 * value)
        return
      case 0x48:
      case 6:
      case 16:
        this.onUpdateReverb(100 * value)
        return
      case 0x4a:
        this.onUpdateModOsc1(100 * value)
        return
      case 0x47:
        this.onUpdateModOsc2(100 * value)
        return
      case 4:
        case 17:
        this.onUpdateModFrequency(10 * value)
        return
      case 0x5b:
        this.onUpdateVolume(100 * value)
        return
      case 33: // "x1" button
      case 51:
        this.moDouble = value > 0
        this.changeModMultiplier()
        return
      case 34: // "x2" button
      case 52:
        this.moQuadruple = value > 0
        this.changeModMultiplier()
        return
    }
  }
  // 'value' is normalized to [-1,1]
  pitchWheel(value) {
    var i

    this.currentPitchWheel = value

    for (i = 0; i < 255; i++) {
      if (this.voices[i]) {
        if (this.voices[i].osc1) {
          // value in cents - detune major fifth.
          this.voices[i].osc1.detune.value = this.currentOsc1Detune + this.currentPitchWheel * 500
        }
        if (this.voices[i].osc2) {
          // value in cents - detune major fifth.
          this.voices[i].osc2.detune.value = this.currentOsc2Detune + this.currentPitchWheel * 500
        }
      }
    }
  }

  polyPressure(noteNumber, value) {
    if (this.voices[noteNumber]) {
      this.voices[noteNumber].setFilterQ(value * 20)
    }
  }

  onUpdateModWaveform(ev) {
    this.currentModWaveform = ev.target.selectedIndex
    for (var i = 0; i < 255; i++) {
      if (this.voices[i]) {
        this.voices[i].setModWaveform(this.waveforms[this.currentModWaveform])
      }
    }
  }

  onUpdateModFrequency(value) {
    if (value < 0 || value > 10) {
      throw new RangeError('value must be between 0 and 10')
    }
    this.currentModFrequency = value
    var oscFreq = this.currentModFrequency * this.modOscFreqMultiplier
    for (var i = 0; i < 255; i++) {
      if (this.voices[i]) {
        this.voices[i].updateModFrequency(oscFreq)
      }
    }
  }

  onUpdateModOsc1(value) {
    if (value < 0 || value > 100) {
      throw new RangeError
    }
    this.currentModOsc1 = value
    for (var i = 0; i < 255; i++) {
      if (this.voices[i]) {
        this.voices[i].updateModOsc1(this.currentModOsc1)
      }
    }
  }

  onUpdateModOsc2(value) {
    if (value < 0 || value > 100) {
      throw new RangeError
    }
    this.currentModOsc2 = value
    for (var i = 0; i < 255; i++) {
      if (this.voices[i]) {
        this.voices[i].updateModOsc2(this.currentModOsc2)
      }
    }
  }

  onUpdateFilterCutoff(value) {
    if (value < 20 || value > 20000) {
      throw new RangeError
    }
    this.currentFilterCutoff = value
    for (var i = 0; i < 255; i++) {
      if (this.voices[i]) {
        this.voices[i].setFilterCutoff(value)
      }
    }
  }

  onUpdateFilterQ(value) {
    if (value < 0 || value > 20) {
      throw new RangeError
    }
    var value = ev.currentTarget ? ev.currentTarget.value : ev
    this.currentFilterQ = value
    for (var i = 0; i < 255; i++) {
      if (this.voices[i]) {
        this.voices[i].setFilterQ(value)
      }
    }
  }

  onUpdateFilterMod(value) {
    if (value < 0 || value > 100) {
      throw new RangeError
    }
    this.currentFilterMod = value
    for (var i = 0; i < 255; i++) {
      if (this.voices[i]) {
        this.voices[i].setFilterMod(value)
      }
    }
  }

  onUpdateFilterEnv(value) {
    if (value < 0 || value > 100) {
      throw new RangeError
    }
    this.currentFilterEnv = value
  }

  onUpdateOsc1Wave(value) {
    if (this.waveforms.indexOf(value) === -1) {
      throw new RangeError
    }
    this.currentOsc1Waveform = value
    for (var i = 0; i < 255; i++) {
      if (this.voices[i]) {
        this.voices[i].setOsc1Waveform(this.waveforms[this.currentOsc1Waveform])
      }
    }
  }

  onUpdateOsc1Octave(value) {
    let options = ["32'","16'", "8'"]
    if (options.indexOf(value) === -1) {
      throw new RangeError
    }
    this.currentOsc1Octave = value
    for (var i = 0; i < 255; i++) {
      if (this.voices[i]) {
        this.voices[i].updateOsc1Frequency()
      }
    }
  }

  onUpdateOsc1Detune(value) {
    if (value < -1200 || value > 1200) {
      throw new RangeError
    }
    this.currentOsc1Detune = value
    for (var i = 0; i < 255; i++) {
      if (this.voices[i]) {
        this.voices[i].updateOsc1Frequency()
      }
    }
  }

  onUpdateOsc1Mix(value) {
    if (value < 0 || value > 100) {
      throw new RangeError
    }
    this.currentOsc1Mix = value
    for (var i = 0; i < 255; i++) {
      if (this.voices[i]) {
        this.voices[i].updateOsc1Mix(value)
      }
    }
  }

  onUpdateOsc2Wave(value) {
    if (this.waveforms.indexOf(value) === -1) {
      throw new RangeError
    }
    this.currentOsc2Waveform = value
    for (var i = 0; i < 255; i++) {
      if (this.voices[i]) {
        this.voices[i].setOsc2Waveform(this.waveforms[this.currentOsc2Waveform])
      }
    }
  }

  onUpdateOsc2Octave(value) {
    let options = ["16'","8'", "4'"]
    if (options.indexOf(value) === -1) {
      throw new RangeError
    }
    this.currentOsc2Octave = value
    for (var i = 0; i < 255; i++) {
      if (this.voices[i]) {
        this.voices[i].updateOsc2Frequency()
      }
    }
  }

  onUpdateOsc2Detune(value) {
    if (value < -1200 || value > 1200) {
      throw new RangeError
    }
    this.currentOsc2Detune = value
    for (var i = 0; i < 255; i++) {
      if (this.voices[i]) {
        this.voices[i].updateOsc2Frequency()
      }
    }
  }

  onUpdateOsc2Mix(value) {
    if (value < 0 || value > 100) {
      throw new RangeError
    }
    this.currentOsc2Mix = value
    for (var i = 0; i < 255; i++) {
      if (this.voices[i]) {
        this.voices[i].updateOsc2Mix(value)
      }
    }
  }

  onUpdateEnvA(value) {
    if (value < 0 || value > 100) {
      throw new RangeError
    }
    this.currentEnvA = value
  }

  onUpdateEnvD(value) {
    if (value < 0 || value > 100) {
      throw new RangeError
    }
    this.currentEnvD = value
  }

  onUpdateEnvS(value) {
    if (value < 0 || value > 100) {
      throw new RangeError
    }
    this.currentEnvS = value
  }

  onUpdateEnvR(value) {
    if (value < 0 || value > 100) {
      throw new RangeError
    }
    this.currentEnvR = value
  }

  onUpdateFilterEnvA(value) {
    if (value < 0 || value > 100) {
      throw new RangeError
    }
    this.currentFilterEnvA = value
  }

  onUpdateFilterEnvD(value) {
    if (value < 0 || value > 100) {
      throw new RangeError
    }
    this.currentFilterEnvD = value
  }

  onUpdateFilterEnvS(value) {
    if (value < 0 || value > 100) {
      throw new RangeError
    }
    this.currentFilterEnvS = value
  }

  onUpdateFilterEnvR(value) {
    if (value < 0 || value > 100) {
      throw new RangeError
    }
    this.currentFilterEnvR = value
  }

  onUpdateDrive(value) {
    if (value < 0 || value > 100) {
      throw new RangeError
    }
    this.currentDrive = value
    this.waveshaper.setDrive(0.01 + this.currentDrive * this.currentDrive / 500)
  }

  onUpdateVolume(value) {
    if (value < 0 || value > 100) {
      throw new RangeError
    }
    this.volNode.gain.value = value / 100
  }

  onUpdateReverb(value) {
    if (value < 0 || value > 100) {
      throw new RangeError
    }
    value = value / 100

    // equal-power crossfade
    var gain1 = Math.cos(value * 0.5 * Math.PI)
    var gain2 = Math.cos((1.0 - value) * 0.5 * Math.PI)

    this.revBypassGain.gain.value = gain1
    this.revGain.gain.value = gain2
  }

  changeModMultiplier() {
    this.modOscFreqMultiplier = (this.moDouble ? 2 : 1) * (this.moQuadruple ? 4 : 1)
    this.onUpdateModFrequency(this.currentModFrequency)
  }

  keyDown(ev) {
    if (ev.keyCode === 49 || ev.keyCode === 50) {
      if (ev.keyCode === 49) {
        this.moDouble = true
      } else if (ev.keyCode === 50) {
        this.moQuadruple = true
      }
      this.changeModMultiplier()
    }

    var note = this.keys[ev.keyCode]
    if (note) {
      this.noteOn(note + 12 * (3 - this.currentOctave), 0.75)
    }

    return false
  }

  keyUp(note) {
    /*
    if (ev.keyCode === 49 || ev.keyCode === 50) {
      if (ev.keyCode === 49) {
        this.moDouble = false
      } else if (ev.keyCode === 50) {
        this.moQuadruple = false
      }

      this.changeModMultiplier()
    }
    */

    var midiNum = noteToMidiNumber(note)
    if (note) {
      this.noteOff(note + 12 * (3 - this.currentOctave))
    }

    return false
  }

  onChangeOctave(ev) {
    this.currentOctave = ev.target.selectedIndex
  }

  initAudio() {
    this.audioContext = new AudioContext()

    // set up the master effects chain for all voices to connect to.
    this.effectChain = this.audioContext.createGain()
    this.waveshaper = new WaveShaper(this.audioContext)
    this.effectChain.connect(this.waveshaper.input)
    this.onUpdateDrive(this.currentDrive)

    this.revNode = this.audioContext.createGain()
    this.revGain = this.audioContext.createGain()
    this.revBypassGain = this.audioContext.createGain()

    this.volNode = this.audioContext.createGain()
    this.volNode.gain.value = this.currentVol
    this.compressor = this.audioContext.createDynamicsCompressor()
    this.waveshaper.output.connect(this.revNode)
    this.waveshaper.output.connect(this.revBypassGain)
    this.revNode.connect(this.revGain)
    this.revGain.connect(this.volNode)
    this.revBypassGain.connect(this.volNode)
    this.onUpdateReverb({currentTarget: { value: this.currentRev }})

    this.volNode.connect(this.compressor)
    this.compressor.connect(this.audioContext.destination)
    this.onUpdateVolume({
      currentTarget: { value: this.currentVol }
    })

    var irRRequest = new XMLHttpRequest()
    irRRequest.open("GET", "sounds/irRoom.wav", true)
    irRRequest.responseType = "arraybuffer"
    irRRequest.onload = () => {
      this.audioContext.decodeAudioData(irRRequest.response, (buffer) => {
        if (this.revNode) {
          this.revNode.buffer = buffer
        } else {
        }
      })
    }
    irRRequest.send()

  }
}

module.exports = Synthesizer
