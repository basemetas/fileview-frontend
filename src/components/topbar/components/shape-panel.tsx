/* eslint-disable no-unused-vars */
import ColorPicker from './ColorPicker';
import styles from './index.module.scss';
import { ToolType } from '@/types';

// rect, circle, line
enum ShapeType {
  RECT = 'rect',
  CIRCLE = 'circle',
  LINE = 'line',
}

const ShapePanel = (props: any) => {
  const { options, onOptionsChange } = props;

  const handleColorChange = (color: string) => {
    onOptionsChange(ToolType.Shape, { ...options, color });
  };

  const handleShapeTypeChange = (type: ShapeType) => {
    onOptionsChange(ToolType.Shape, { ...options, type });
  };

  return (
    <div className={styles.brushPanel}>
      {/* 颜色选择区 */}
      <ColorPicker value={options.color} onChange={handleColorChange} />

      {/* 形状选择区 */}
      <div className={styles.sizeSection}>
        <div className={styles.sizeLabel}>形状</div>
        <div className={styles.shapeButtons}>
          <button
            className={`${styles.shapeButton} ${options.type === ShapeType.CIRCLE ? styles.active : ''}`}
            onClick={() => handleShapeTypeChange(ShapeType.CIRCLE)}
            title='圆形'
          >
            <svg width='32' height='32' viewBox='0 0 24 24'>
              <circle
                cx='12'
                cy='12'
                r='8'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              />
            </svg>
          </button>
          <button
            className={`${styles.shapeButton} ${options.type === ShapeType.RECT ? styles.active : ''}`}
            onClick={() => handleShapeTypeChange(ShapeType.RECT)}
            title='矩形'
          >
            <svg width='32' height='32' viewBox='0 0 24 24'>
              <rect
                x='5'
                y='7'
                width='14'
                height='10'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              />
            </svg>
          </button>
          <button
            className={`${styles.shapeButton} ${options.type === ShapeType.LINE ? styles.active : ''}`}
            onClick={() => handleShapeTypeChange(ShapeType.LINE)}
            title='直线'
          >
            <svg width='32' height='32' viewBox='0 0 24 24'>
              <line
                x1='6'
                y1='18'
                x2='18'
                y2='6'
                stroke='currentColor'
                strokeWidth='2'
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShapePanel;
