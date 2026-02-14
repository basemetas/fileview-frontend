import { Button, Popover } from 'antd';
import { useEffect, useState } from 'react';
import styles from './index.module.scss';
import {
  UndoOutlined,
  RedoOutlined,
  FontSizeOutlined,
  HighlightOutlined,
  BorderOutlined,
  SignatureOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { ToolType, EventType } from '@/types';
import { eventEmitter } from '@/utils';
import { log } from '@/utils';

// 工具面板组件
import BrushPanel from './brush-panel';
import TextPanel from './text-panel';
import ShapePanel from './shape-panel';
import SignaturePanel from './signature-panel';

export interface SignToolsProps {
  currentToolType?: string;
  brushOptions?: any;
  textOptions?: any;
  shapeOptions?: any;
  // eslint-disable-next-line no-unused-vars
  onOptionsChange?: (type: string, options: any) => void;
  // eslint-disable-next-line no-unused-vars
  onToolTypeChange?: (toolType: string) => void;
}
// message.config({
//   top: 60, // 临时调整位置
//   maxCount: 2, // 临时限制数量
// });

const SignTools = (props: SignToolsProps) => {
  const {
    currentToolType,
    brushOptions,
    textOptions,
    shapeOptions,
    onOptionsChange,
    onToolTypeChange,
  } = props;
  const activeToolType = currentToolType || null;
  const [panelOpen, setPanelOpen] = useState(true);

  // 处理工具点击
  const handleToolClick = (toolType: string) => {
    if (activeToolType === toolType) {
      if (panelOpen) {
        // 如果此时面板打开且点击当前按钮，则切换面板打开状态
        setPanelOpen(false);
        // 如果是签名和签章，则退出工具
        // if (toolType === ToolType.Signature || toolType === ToolType.Stamp) {
        //   onToolTypeChange?.(ToolType.None);
        // }
      } else {
        // 如果此时面板打开且点击当前按钮，则将编辑类型重置为空
        // onToolTypeChange?.(ToolType.None);
        // message.info(`已退出${ToolTypeName[toolType as ToolType]}编辑`);
      }
      // setPanelOpen(false);
    } else {
      // 点击新按钮，切换工具和打开面板
      onToolTypeChange?.(toolType);
      setPanelOpen(true);
      // message.info(`已进入${ToolTypeName[toolType as ToolType]}编辑`);
    }
  };

  // 处理面板关闭
  const handlePanelClose = (toolType: string, shouldOpen: boolean) => {
    setPanelOpen(shouldOpen);
    log.debug('handlePanelClose', toolType, shouldOpen);

    // 如果面板打开，重新发送工具类型变化消息以激活绘制模式
    if (shouldOpen) {
      // 先设置为None，再设置回原工具类型，确保触发useEffect重新执行
      onToolTypeChange?.(ToolType.None);
      setTimeout(() => {
        onToolTypeChange?.(toolType);
      }, 0);
    }

    // 如果是签名和签章退出，将工具类型重置为空
    if (
      !shouldOpen &&
      (toolType === ToolType.Signature || toolType === ToolType.Stamp)
    ) {
      onToolTypeChange?.(ToolType.None);
    }
  };

  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // 撤销
  const handleUndo = () => {
    log.debug('撤销');
    eventEmitter.emit(EventType.Undo);
  };

  // 重做
  const handleRedo = () => {
    log.debug('重做');
    eventEmitter.emit(EventType.Redo);
  };

  useEffect(() => {
    // 监听历史记录变化事件
    eventEmitter.on(EventType.HistoryChange, (stats) => {
      log.debug('topbar 接收到历史记录变化:', stats);
      const { canUndo, canRedo } = stats;
      setCanUndo(canUndo);
      setCanRedo(canRedo);
    });

    return () => {
      // 移除监听历史记录变化事件
      eventEmitter.off(EventType.HistoryChange);
    };
  }, []);

  return (
    <div className={styles.signModeTools}>
      <Button
        disabled={!canUndo}
        className={styles.button}
        title='撤销'
        icon={<UndoOutlined className={styles.icon} title='撤销' />}
        onClick={handleUndo}
      ></Button>
      <Button
        disabled={!canRedo}
        className={styles.button}
        title='重做'
        onClick={handleRedo}
        icon={<RedoOutlined className={styles.icon} title='重做' />}
      ></Button>
      <Popover
        content={
          <BrushPanel
            options={brushOptions}
            onOptionsChange={onOptionsChange}
          />
        }
        trigger='click'
        open={panelOpen && activeToolType === ToolType.Brush}
        onOpenChange={(shouldOpen) =>
          handlePanelClose(ToolType.Brush, shouldOpen)
        }
        placement='bottom'
      >
        <Button
          className={`${styles.button} ${activeToolType === ToolType.Brush ? styles.active : ''}`}
          icon={<HighlightOutlined className={styles.icon} />}
          onClick={() => handleToolClick(ToolType.Brush)}
        >
          画笔
        </Button>
      </Popover>
      <Popover
        content={
          <TextPanel options={textOptions} onOptionsChange={onOptionsChange} />
        }
        trigger='click'
        open={panelOpen && activeToolType === ToolType.Text}
        onOpenChange={(shouldOpen) =>
          handlePanelClose(ToolType.Text, shouldOpen)
        }
        placement='bottom'
      >
        <Button
          className={`${styles.button} ${activeToolType === ToolType.Text ? styles.active : ''}`}
          icon={<FontSizeOutlined className={styles.icon} />}
          onClick={() => handleToolClick(ToolType.Text)}
        >
          文本
        </Button>
      </Popover>
      <Popover
        content={
          <ShapePanel
            options={shapeOptions}
            onOptionsChange={onOptionsChange}
          />
        }
        trigger='click'
        open={panelOpen && activeToolType === ToolType.Shape}
        onOpenChange={(shouldOpen) =>
          handlePanelClose(ToolType.Shape, shouldOpen)
        }
        placement='bottom'
      >
        <Button
          className={`${styles.button} ${activeToolType === ToolType.Shape ? styles.active : ''}`}
          icon={<BorderOutlined className={styles.icon} />}
          onClick={() => handleToolClick(ToolType.Shape)}
        >
          线框
        </Button>
      </Popover>
      <Popover
        content={
          <SignaturePanel
            type={ToolType.Signature}
            options={brushOptions}
            onOptionsChange={onOptionsChange}
          />
        }
        // overlayStyle={{ maxHeight: 340, overflow: 'auto' }}
        trigger='click'
        open={panelOpen && activeToolType === ToolType.Signature}
        onOpenChange={(shouldOpen) =>
          handlePanelClose(ToolType.Signature, shouldOpen)
        }
        placement='bottom'
      >
        <Button
          className={`${styles.button} ${activeToolType === ToolType.Signature ? styles.active : ''}`}
          icon={<SignatureOutlined className={styles.icon} />}
          onClick={() => handleToolClick(ToolType.Signature)}
        >
          签名
        </Button>
      </Popover>
      <Popover
        content={
          <SignaturePanel
            type={ToolType.Stamp}
            options={brushOptions}
            onOptionsChange={onOptionsChange}
          />
        }
        // overlayStyle={{ maxHeight: 340, overflow: 'auto' }}
        trigger='click'
        open={panelOpen && activeToolType === ToolType.Stamp}
        onOpenChange={(shouldOpen) =>
          handlePanelClose(ToolType.Stamp, shouldOpen)
        }
        placement='bottom'
      >
        <Button
          className={`${styles.button} ${activeToolType === ToolType.Stamp ? styles.active : ''}`}
          icon={<AuditOutlined className={styles.icon} />}
          onClick={() => handleToolClick(ToolType.Stamp)}
        >
          签章
        </Button>
      </Popover>
    </div>
  );
};
export default SignTools;
