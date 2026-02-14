import { Select } from 'antd';
import ColorPicker from './ColorPicker';
import styles from './index.module.scss';
import { ToolType } from '@/types';

const BrushPanel = (props: any) => {
  const { options, onOptionsChange } = props;

  const sizeOptions = [
    { value: 2, width: 2 },
    { value: 4, width: 4 },
    { value: 8, width: 8 },
  ];

  const eraserSizes = [
    { value: 10, label: '小' },
    { value: 20, label: '中' },
    { value: 30, label: '大' },
  ];

  const handleColorChange = (color: string) => {
    // 颜色变化时重置橡皮擦，退出擦除状态
    onOptionsChange(ToolType.Brush, { ...options, color, eraserSize: 0 });
  };

  const handleSizeChange = (size: number) => {
    // 粗细变化时重置橡皮擦，退出擦除状态
    onOptionsChange(ToolType.Brush, { ...options, size, eraserSize: 0 });
  };

  const handleEraserSizeChange = (size: number) => {
    // 如果size等于当前选中的eraserSize，则取消选择
    if (size === options.eraserSize) {
      onOptionsChange(ToolType.Brush, { ...options, eraserSize: 0 });
      return;
    }
    onOptionsChange(ToolType.Brush, { ...options, eraserSize: size });
  };

  return (
    <div className={styles.brushPanel}>
      {/* 颜色选择区 */}
      <ColorPicker value={options.color} onChange={handleColorChange} />

      {/* 粗细选择区 */}
      <div className={styles.sizeSection}>
        <div className={styles.sizeLabel}>粗细</div>
        <Select
          className={styles.sizeSelect}
          value={options.size}
          defaultValue={options.size}
          onChange={handleSizeChange}
          popupClassName={styles.sizeDropdown}
        >
          {sizeOptions.map((item) => (
            <Select.Option key={item.value} value={item.value}>
              <div className={styles.sizeOptionItem}>
                <div
                  className={styles.sizeLine}
                  style={{
                    height: `${item.width}px`,
                  }}
                />
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>

      {/* 橡皮擦大小区 */}
      <div className={styles.eraserSection}>
        <div className={styles.eraserLabel}>橡皮擦大小</div>
        <div className={styles.eraserOptions}>
          {eraserSizes.map((item) => (
            <div
              key={item.value}
              className={`${styles.eraserItem} ${
                options.eraserSize === item.value ? styles.active : ''
              }`}
              onClick={() => handleEraserSizeChange(item.value)}
            >
              <div
                className={styles.eraserDot}
                style={{
                  width: `${item.value}px`,
                  height: `${item.value}px`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrushPanel;
