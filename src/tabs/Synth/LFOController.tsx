import { Select, Slider } from 'antd';
import { waveforms } from '../../utils/waveforms';
import { useSnapshot } from 'valtio';
import { lfoState } from '../../state/LFO/lfoState';

const { Option } = Select;

export default function LFOController() {
  const { shape, frequency } = useSnapshot(lfoState);

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label>LFO Shape:</label>
        <Select
          value={shape}
          onChange={(newShape) => (lfoState.shape = newShape)}
          style={{ width: '100%' }}
        >
          {waveforms.map((waveform) => (
            <Option key={waveform} value={waveform}>
              {waveform}
            </Option>
          ))}
        </Select>
      </div>
      <div>
        <label>LFO Frequency:</label>
        <Slider
          min={0.1}
          max={20}
          step={0.1}
          value={+(frequency ?? 0)}
          onChange={(value) => (lfoState.frequency = value)}
          tooltip={{ formatter: (value) => `${value} Hz` }}
        />
      </div>
    </div>
  );
}
