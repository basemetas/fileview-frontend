import { Select } from 'antd';
import ColorPicker from './ColorPicker';
import styles from './index.module.scss';
import classNames from 'classnames';
import { ToolType } from '@/types';

const TextPanel = (props: any) => {
  const { options, onOptionsChange } = props;

  const sizeOptions = [
    { value: 12 },
    { value: 16 },
    { value: 20 },
    { value: 24 },
    { value: 28 },
    { value: 32 },
  ];

  const handleColorChange = (color: string) => {
    onOptionsChange(ToolType.Text, { ...options, color });
  };

  const handleSizeChange = (size: number) => {
    onOptionsChange(ToolType.Text, { ...options, size });
  };

  return (
    <div className={styles.brushPanel}>
      {/* 颜色选择区 */}
      <ColorPicker value={options.color} onChange={handleColorChange} />

      {/* 文本大小选择区 */}
      <div className={styles.sizeSection}>
        <div className={styles.sizeLabel}>字号</div>
        <Select
          className={classNames(styles.sizeSelect, styles.textPanelSizeSelect)}
          value={options.size}
          defaultValue={options.size}
          onChange={handleSizeChange}
          popupClassName={styles.sizeDropdown}
        >
          {sizeOptions.map((item) => (
            <Select.Option key={item.value} value={item.value}>
              <div className={styles.textPanelFontSize}>{item.value}</div>
            </Select.Option>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default TextPanel;
