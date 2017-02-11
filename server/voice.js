
const frequencyFromNoteNumber = function(note) {
  return 440 * Math.pow(2, (note - 69) / 12)
}

const filterFrequencyFromCutoff = function(pitch, cutoff, ctx) {
  var nyquist = 0.5 * ctx.sampleRate

  //    var filterFrequency = Math.pow(2, (9 * cutoff) - 1) * pitch
  var filterFrequency = Math.pow(2, 9 * cutoff - 1) * pitch
  if (filterFrequency > nyquist) {
    filterFrequency = nyquist
  }
  return filterFrequency
}


const Voice = function Voice(note, velocity, synth) {
  this.originalFrequency = frequencyFromNoteNumber(note)
  this.currentOsc2Octave = synth.currentOsc2Octave
  this.currentOsc2Detune = synth.currentOsc2Detune
  this.currentOsc1Octave = synth.currentOsc1Octave
  this.currentOsc1Detune = synth.currentOsc1Detune
  this.currentPitchWheel = synth.currentPitchWheel
  this.currentEnvR = synth.currentEnvR
  this.currentFilterEnvR = synth.currentFilterEnvR
  this.currentFilterCutoff = synth.currentFilterCutoff
  this.currentFilterMod = synth.currentFilterMod
  let {
    audioContext,
    currentEnvA,
    currentEnvD,
    currentEnvS,
    currentFilterEnv,
    currentFilterEnvA,
    currentFilterEnvD,
    currentFilterEnvS,
    currentFilterQ,
    currentModFrequency,
    currentModOsc1,
    currentModOsc2,
    currentModWaveform,
    currentOsc1Mix,
    currentOsc1Waveform,
    currentOsc2Mix,
    currentOsc2Waveform,
    effectChain,
    modOscFreqMultiplier,
    waveforms,
  } = synth

  this.audioContext = audioContext

  // create osc 1
  this.osc1 = audioContext.createOscillator()
  this.updateOsc1Frequency()
  this.osc1.type = waveforms[currentOsc1Waveform]

  this.osc1Gain = audioContext.createGain()
  // this.osc1Gain.gain.value = 0.005 * currentOsc1Mix
  this.osc1Gain.gain.value = 0.05 + 0.33 * velocity
  this.osc1.connect(this.osc1Gain)

  // create osc 2
  this.osc2 = audioContext.createOscillator()
  this.updateOsc2Frequency()
  this.osc2.type = waveforms[currentOsc2Waveform]

  this.osc2Gain = audioContext.createGain()
  // this.osc2Gain.gain.value = 0.005 * currentOsc2Mix
  this.osc2Gain.gain.value = 0.05 + 0.33 * velocity
  this.osc2.connect(this.osc2Gain)

  // create modulator osc
  this.modOsc = audioContext.createOscillator()
  this.modOsc.type = 	waveforms[currentModWaveform]
  this.modOsc.frequency.value = currentModFrequency * modOscFreqMultiplier

  this.modOsc1Gain = audioContext.createGain()
  this.modOsc.connect(this.modOsc1Gain)
  this.modOsc1Gain.gain.value = currentModOsc1 / 10
  this.modOsc1Gain.connect(this.osc1.frequency)	// tremolo

  this.modOsc2Gain = audioContext.createGain()
  this.modOsc.connect(this.modOsc2Gain)
  this.modOsc2Gain.gain.value = currentModOsc2 / 10
  this.modOsc2Gain.connect(this.osc2.frequency)	// tremolo

  // create the LP filter
  this.filter1 = audioContext.createBiquadFilter()
  this.filter1.type = "lowpass"
  this.filter1.Q.value = currentFilterQ
  this.filter1.frequency.value = Math.pow(2, this.currentFilterCutoff)
  this.filter2 = audioContext.createBiquadFilter()
  this.filter2.type = "lowpass"
  this.filter2.Q.value = currentFilterQ
  this.filter2.frequency.value = Math.pow(2, this.currentFilterCutoff)

  this.osc1Gain.connect(this.filter1)
  this.osc2Gain.connect(this.filter1)
  this.filter1.connect(this.filter2)

  // connect the modulator to the filters
  this.modFilterGain = audioContext.createGain()
  this.modOsc.connect(this.modFilterGain)
  this.modFilterGain.gain.value = this.currentFilterMod * 24
  this.modFilterGain.connect(this.filter1.detune)	// filter tremolo
  this.modFilterGain.connect(this.filter2.detune)	// filter tremolo

  // create the volume envelope
  this.envelope = audioContext.createGain()
  this.filter2.connect(this.envelope)
  this.envelope.connect(effectChain)

  // set up the volume and filter envelopes
  var now = audioContext.currentTime
  var envAttackEnd = now + currentEnvA / 20.0

  this.envelope.gain.value = 0.0
  this.envelope.gain.setValueAtTime(0.0, now)
  this.envelope.gain.linearRampToValueAtTime(1.0, envAttackEnd)
  this.envelope.gain.setTargetAtTime(currentEnvS / 100.0, envAttackEnd, currentEnvD / 100.0 + 0.001)

  var filterAttackLevel = currentFilterEnv * 72  // Range: 0-7200: 6-octave range
  var filterSustainLevel = filterAttackLevel * currentFilterEnvS / 100.0 // range: 0-7200
  var filterAttackEnd = currentFilterEnvA / 20.0

  if (!filterAttackEnd) {
    filterAttackEnd = 0.05 // tweak to get target decay to work properly
  }
  this.filter1.detune.setValueAtTime(0, now)
  this.filter1.detune.linearRampToValueAtTime(filterAttackLevel, now + filterAttackEnd)
  this.filter2.detune.setValueAtTime(0, now)
  this.filter2.detune.linearRampToValueAtTime(filterAttackLevel, now + filterAttackEnd)
  this.filter1.detune.setTargetAtTime(filterSustainLevel, now + filterAttackEnd, currentFilterEnvD / 100.0)
  this.filter2.detune.setTargetAtTime(filterSustainLevel, now + filterAttackEnd, currentFilterEnvD / 100.0)

  this.osc1.start(0)
  this.osc2.start(0)
  this.modOsc.start(0)
}


Voice.prototype.setModWaveform = function(value) {
  this.modOsc.type = value
}

Voice.prototype.updateModFrequency = function(value) {
  this.modOsc.frequency.value = value
}

Voice.prototype.updateModOsc1 = function(value) {
  this.modOsc1Gain.gain.value = value / 10
}

Voice.prototype.updateModOsc2 = function(value) {
  this.modOsc2Gain.gain.value = value / 10
}

Voice.prototype.setOsc1Waveform = function(value) {
  this.osc1.type = value
}

Voice.prototype.updateOsc1Frequency = function() {
  // -2 because osc1 is 32', 16', 8'
  let val = this.originalFrequency * Math.pow(2, this.currentOsc1Octave - 2)
  this.osc1.frequency.value = val
  this.osc1.detune.value = this.currentOsc1Detune + this.currentPitchWheel * 500	// value in cents - detune major fifth.
}

Voice.prototype.updateOsc1Mix = function(value) {
  this.osc1Gain.gain.value = 0.005 * value
}

Voice.prototype.setOsc2Waveform = function(value) {
  this.osc2.type = value
}

Voice.prototype.updateOsc2Frequency = function() {
  this.osc2.frequency.value = this.originalFrequency * Math.pow(2, this.currentOsc2Octave - 1)
  this.osc2.detune.value = this.currentOsc2Detune + this.currentPitchWheel * 500	// value in cents - detune major fifth.
}

Voice.prototype.updateOsc2Mix = function(value) {
  this.osc2Gain.gain.value = 0.005 * value
}

Voice.prototype.setFilterCutoff = function(value) {
  var filterFrequency = Math.pow(2, value)
  this.filter1.frequency.value = filterFrequency
  this.filter2.frequency.value = filterFrequency
}

Voice.prototype.setFilterQ = function(value) {
  this.filter1.Q.value = value
  this.filter2.Q.value = value
}

Voice.prototype.setFilterMod = function() {
  this.modFilterGain.gain.value = this.currentFilterMod * 24
}

Voice.prototype.noteOff = function() {
  var now = this.audioContext.currentTime
  var release = now + this.currentEnvR / 10.0
  filterFrequencyFromCutoff(this.originalFrequency, this.currentFilterCutoff / 100 * (1.0 - this.currentFilterEnv / 100.0), this.audioContext)

  this.envelope.gain.cancelScheduledValues(now)
  this.envelope.gain.setValueAtTime(this.envelope.gain.value, now)  // this is necessary because of the linear ramp
  this.envelope.gain.setTargetAtTime(0.0, now, this.currentEnvR / 100)
  this.filter1.detune.cancelScheduledValues(now)
  this.filter1.detune.setTargetAtTime(0, now, this.currentFilterEnvR / 100.0)
  this.filter2.detune.cancelScheduledValues(now)
  this.filter2.detune.setTargetAtTime(0, now, this.currentFilterEnvR / 100.0)

  this.osc1.stop(release)
  this.osc2.stop(release)
}

module.exports = Voice
