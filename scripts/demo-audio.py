"""Generate the original 24-second music-box sample; no external recordings."""
import math
import struct
import wave
from pathlib import Path

output = Path(__file__).resolve().parents[1] / 'demo/public/assets/summer.wav'
output.parent.mkdir(parents=True, exist_ok=True)
rate = 22050
notes = [72, 76, 79, 83, 81, 79, 76, 74, 72, 76, 79, 84, 83, 79, 76, 74,
         69, 72, 76, 79, 77, 76, 74, 72, 67, 71, 74, 79, 76, 74, 72, 72]
with wave.open(str(output), 'wb') as stream:
    stream.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
    for sample in range(rate * 24):
        t = sample / rate
        index = min(int(t / .75), len(notes) - 1)
        local = t - index * .75
        frequency = 440 * 2 ** ((notes[index] - 69) / 12)
        attack = min(local / .015, 1)
        decay = math.exp(-local * 4)
        tone = math.sin(2 * math.pi * frequency * local) + .22 * math.sin(2 * math.pi * frequency * 2 * local)
        end_fade = min((24 - t) / .4, 1)
        stream.writeframesraw(struct.pack('<h', int(8000 * tone * attack * decay * end_fade)))
print(output)
