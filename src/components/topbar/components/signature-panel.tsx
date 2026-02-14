import { PlusOutlined } from '@ant-design/icons';
import styles from './index.module.scss';
import { eventEmitter } from '@/utils';
import { EventType, ToolType } from '@/types';

interface SignaturePanelProps {
  type: string;
  options?: any;
  onOptionsChange?: (type: string, options: any) => void;
}

const SignaturePanel = (props: SignaturePanelProps) => {
  const { type } = props;

  // 测试签名图片（base64 格式）
  const testSignature =
    'data:image/svg+xml;base64,' +
    btoa(`
    <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
      <path d="M 50 80 Q 70 50 90 70 T 130 80" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M 90 70 Q 100 100 120 90 Q 140 80 150 100" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>
  `);

  // 测试签章图片
  const testStamp =
    'data:image/svg+xml;base64,' +
    btoa(`
    <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
      <path d="M 50 80 Q 70 50 90 70 T 130 80" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M 90 70 Q 100 100 120 90 Q 140 80 150 100" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>
  `);

  const handleAddSignature = () => {
    console.log('添加签名', type);
    // TODO: 打开签名编辑器或上传签名图片
  };

  const handleSelectSignature = (signature: string) => {
    // console.log('选择签名:', signature);
    // TODO: 将选中的签名插入到画布，发送消息给画布，通知画布更新
    eventEmitter.emit(EventType.SignatureSelected, signature);
  };

  return (
    <div className={styles.signaturePanel}>
      {/* 添加签名按钮 */}
      <div className={styles.signatureItem} onClick={handleAddSignature}>
        <div className={styles.addSignatureBox}>
          <PlusOutlined className={styles.plusIcon} />
          <div className={styles.addText}>
            {type === ToolType.Signature ? '添加签名' : '添加签章'}
          </div>
        </div>
      </div>

      {/* 测试签名 */}
      {[...Array(4)].map((_value, index) => {
        return (
          <div
            key={index}
            className={styles.signatureItem}
            onClick={() =>
              handleSelectSignature(
                type === ToolType.Signature ? testSignature : testStamp,
              )
            }
          >
            <div className={styles.signatureBox}>
              <img
                src={type === ToolType.Signature ? testSignature : testStamp}
                alt={type === ToolType.Signature ? '签名' : '签章'}
                className={styles.signatureImage}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SignaturePanel;
