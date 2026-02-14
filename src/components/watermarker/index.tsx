/*
 * Copyright 2025 BaseMetas
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useEffect, useRef, useContext } from 'react';
import styles from './index.module.scss';
import { WaterMarkProps } from '@/types';
import AppContext from '@/context';

/*
{
  // 文字内容，支持使用 \\n 换行，建议不超过2行
  value: '张三丰(190465)\\n192.168.80.163';
  // 水印颜色，支持 rgba 和 hax 颜色（如：#ff0000）
  fillstyle: 'rgba( 192, 192, 192, 0.6 )';
  // 字号和字体
  font: '20px Arial';
  // 旋转角度，支持正负 120° 以内
  rotate: -30;
  // 水平间隔
  horizontal: 30;
  // 垂直间隔
  vertical: 30;
  // 整体透明度，0-1 之间的数字。默认为1，全不透明
  opacity: 0.4;
}
*/

const WaterMarker = (props: WaterMarkProps) => {
  // 获取全局水印配置
  let { watermark, componentProps } = useContext(AppContext);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const generatedRef = useRef(false);
  const observerRef = useRef<MutationObserver | null>(null);
  const drawSizeRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const { originalFileFormat = '' } = componentProps || {};

  // 是否需要渲染水印
  const isOffice = /^(doc|wp|xl|et|ppt|rtf|csv)/i.test(originalFileFormat);
  const isPdf = /^(pdf|ofd|uof|dof)/i.test(originalFileFormat);
  const shouldRender = isOffice || isPdf;

  const finalConfig = { ...watermark, ...props };

  const {
    fullPage = false,
    value = '',
    fillstyle = 'rgba(192, 192, 192, 1)',
    font = '14px Arial',
    rotate = -40,
    horizontal = 30,
    vertical = 30,
    opacity = 0.3,
    pageWidth,
    pageHeight,
  } = finalConfig;

  // 仅首次渲染时生成水印到 canvas，之后不再重绘
  useEffect(() => {
    if (!shouldRender || generatedRef.current || !canvasRef.current) return;
    generatedRef.current = true;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    // 使用 2 倍设备像素比提升清晰度
    const dpr = 2;

    // 获取父容器尺寸
    const parent = canvas.parentElement;
    if (!parent) return;

    // 确定绘制区域：fullPage 为 true 时使用屏幕宽高，否则使用传入的 pageWidth/pageHeight 或父容器宽高
    const drawWidth = fullPage
      ? window.screen.width
      : pageWidth || parent.clientWidth;
    const drawHeight = fullPage
      ? window.screen.height
      : pageHeight || parent.clientHeight;

    drawSizeRef.current = { width: drawWidth, height: drawHeight };

    // 解析字体信息
    const fontMatch = font.match(/(\d+)px\s+(.*)/i);
    const fontSize = fontMatch ? parseInt(fontMatch[1], 10) : 20;
    const fontFamily = fontMatch ? fontMatch[2] : 'Arial';

    // 分割多行文本
    const lines = value.trim().split('\n');
    const lineHeight = fontSize * 1.2;
    const textHeight = lines.length * lineHeight;

    // 测量文本宽度
    ctx.font = `${fontSize}px ${fontFamily}`;
    const maxWidth = Math.max(
      ...lines.map((line) => ctx.measureText(line).width),
    );

    // 计算单个水印块的尺寸（旋转后的包围盒）
    const rad = (rotate * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const blockWidth = Math.ceil(
      maxWidth * cos + textHeight * sin + horizontal,
    );
    const blockHeight = Math.ceil(maxWidth * sin + textHeight * cos + vertical);

    // 设置 canvas 物理尺寸（基于绘制区域）
    canvas.width = drawWidth * dpr;
    canvas.height = drawHeight * dpr;

    // 缩放上下文以匹配 DPR
    ctx.scale(dpr, dpr);

    // 计算平铺行列数
    const cols = Math.ceil(drawWidth / blockWidth) + 1;
    const rows = Math.ceil(drawHeight / blockHeight) + 1;

    // 绘制所有水印
    ctx.fillStyle = fillstyle;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * blockWidth + blockWidth / 2;
        const y = row * blockHeight + blockHeight / 2;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rad);

        // 确保文本对齐属性在旋转后仍然有效
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        lines.forEach((line, idx) => {
          const yOffset = (idx - (lines.length - 1) / 2) * lineHeight;
          ctx.fillText(line, 0, yOffset);
        });

        ctx.restore();
      }
    }
  }, [
    fullPage,
    value,
    fillstyle,
    font,
    rotate,
    horizontal,
    vertical,
    pageWidth,
    pageHeight,
    shouldRender,
  ]);

  // 防删除和防篡改保护
  useEffect(() => {
    if (!shouldRender || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const parent = canvas.parentElement;

    // 恢复样式的函数
    const restoreStyles = () => {
      if (!canvas || !canvas.parentElement) return;

      if (fullPage) {
        // fullPage 模式：使用绘制时的固定尺寸，确保等比不缩放，超出部分由父容器裁切
        const { width, height } = drawSizeRef.current;
        canvas.style.width = `${width || window.screen.width}px`;
        canvas.style.height = `${height || window.screen.height}px`;

        // 强制父容器裁切超出部分
        if (canvas.parentElement) {
          canvas.parentElement.style.overflow = 'hidden';
        }
      } else {
        // 非 fullPage 模式：维持原有的 100% 逻辑，随容器缩放
        canvas.style.width = '100%';
        canvas.style.height = '100%';
      }

      canvas.style.opacity = String(opacity);
      canvas.style.pointerEvents = 'none';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.zIndex = '1005';
    };

    // 初始化样式
    restoreStyles();

    // 监听样式属性变化
    observerRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'style' ||
            mutation.attributeName === 'class')
        ) {
          restoreStyles();
        }
      });
    });

    observerRef.current.observe(canvas, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    // 监听父节点子元素变化（防删除）
    if (parent) {
      const parentObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === 'childList' &&
            mutation.removedNodes.length > 0
          ) {
            // 检查 canvas 是否被删除
            if (!parent.contains(canvas)) {
              // 重新添加 canvas
              parent.appendChild(canvas);
              restoreStyles();
            }
          }
        });
      });

      parentObserver.observe(parent, {
        childList: true,
      });

      return () => {
        observerRef.current?.disconnect();
        parentObserver.disconnect();
      };
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [opacity, fullPage, shouldRender]);

  if (!shouldRender) return null;

  return (
    <canvas
      ref={canvasRef}
      className={styles.watermarker}
      style={{
        width: '100%',
        height: '100%',
        opacity,
        pointerEvents: 'none',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1005,
      }}
    />
  );
};

export default WaterMarker;
