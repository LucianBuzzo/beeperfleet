// TODO: Should be in a shared config
const SEQUENCE_LENGTH = 16


const createSequence = () => [...Array(SEQUENCE_LENGTH)].map(() => ({
  active: false,
  pitch: 60,
  gain: 0.5,
  length: 100,
}))

const createLayer = (nameNumber = 1) => ({
  name: 'Layer ' + nameNumber,
  active: false,
  sequence: createSequence(),
  synthOptions: {
    filterCutoff: 256,
    filterQ: 7,
    filterMod: 21,
    filterEnv: 56,
  },
})

module.exports = {
  Layer: {
    create: createLayer,
  },
  Sequence: {
    create: createSequence,
  },
}
