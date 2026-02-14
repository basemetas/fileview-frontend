import { CheckOutlined } from '@ant-design/icons';
import styles from './index.module.scss';

interface ColorPickerProps {
  value: string;
  // eslint-disable-next-line no-unused-vars
  onChange: (color: string) => void;
  colors?: string[];
}

const defaultColors = [
  '#000000', // 黑色
  '#FFB3BA', // 浅粉
  '#FF4D4D', // 红色
  '#8B0000', // 暗红
  '#FFA500', // 橙色
  '#E6FF00', // 黄绿
  '#7CB342', // 绿色
  '#64B5F6', // 蓝色
];

// 计算颜色亮度，返回反色
const getContrastColor = (hexColor: string) => {
  // 将十六进制颜色转换为 RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // 计算亮度（使用 YIQ 公式）
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // 亮度大于 128 返回黑色，否则返回白色
  return brightness > 128 ? '#000000' : '#FFFFFF';
};

const ColorPicker = ({
  value,
  onChange,
  colors = defaultColors,
}: ColorPickerProps) => {
  return (
    <div className={styles.colorSection}>
      <div className={styles.colorGrid}>
        {colors.map((color) => (
          <div
            key={color}
            className={`${styles.colorItem} ${value === color ? styles.active : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          >
            {value === color && (
              <CheckOutlined
                className={styles.checkIcon}
                style={{ color: getContrastColor(color) }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;
