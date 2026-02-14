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

import * as THREE from 'three';
import { log } from '@/utils';

/**
 * 设置 DXF 预览背景色
 */
export function setViewerBackground(viewer: any, color = 0xffffff) {
  const renderer = viewer?.renderer;
  if (!renderer) return;
  renderer.setClearColor(new THREE.Color(color), 1);
  viewer.render?.();
}

/**
 * 设置 DXF 线条统一颜色
 */
export function setViewerLineColor(viewer: any, hex = 0x000000) {
  const scene = viewer?.scene || viewer?.viewer?.scene;
  if (!scene) return false;

  scene.traverse((child: any) => {
    if (!child.material) return;

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    materials.forEach((mat: any) => {
      // 普通材质（LineBasicMaterial / MeshBasicMaterial 等）
      if (mat.color && typeof mat.color.set === 'function') {
        // 如果材质使用 vertexColors，则单改 mat.color 可能无效，走几何属性覆盖逻辑
        if (mat.vertexColors) {
          const geom = child.geometry;
          if (geom && geom.attributes && geom.attributes.color) {
            // 将所有顶点颜色写为黑色
            const attr = geom.attributes.color;
            for (let i = 0; i < attr.count; i++) {
              // setXYZ 是 BufferAttribute 上的方法
              if (typeof attr.setXYZ === 'function') {
                attr.setXYZ(i, 0, 0, 0);
              } else {
                // 兼容性备用：直接修改 array
                const a = attr.array;
                a[i * 3 + 0] = 0;
                a[i * 3 + 1] = 0;
                a[i * 3 + 2] = 0;
              }
            }
            attr.needsUpdate = true;
            mat.vertexColors = false; // 可选：禁用顶点色
          } else {
            mat.vertexColors = false;
            mat.color.set(hex);
          }
        } else {
          mat.color.set(hex);
        }
        mat.needsUpdate = true;
      }

      // ShaderMaterial 或 uniforms 风格的材质
      if (mat.uniforms) {
        if (
          mat.uniforms.color &&
          mat.uniforms.color.value &&
          typeof mat.uniforms.color.value.set === 'function'
        ) {
          try {
            mat.uniforms.color.value.set(hex);
          } catch (e) {
            // Handle shader uniform update errors
          }
        }
        if (
          mat.uniforms.diffuse &&
          mat.uniforms.diffuse.value &&
          typeof mat.uniforms.diffuse.value.set === 'function'
        ) {
          try {
            mat.uniforms.diffuse.value.set(hex);
          } catch (e) {
            // Handle shader uniform update errors
          }
        }
      }
    });
  });

  // 触发重绘
  const renderer = viewer?.renderer || viewer?.viewer?.renderer;
  const camera = viewer?.camera || viewer?.viewer?.camera;
  if (renderer && camera) {
    renderer.render(scene, camera);
  } else if (typeof viewer.render === 'function') {
    viewer.render();
  }

  return true;
}

interface TextSpriteOptions {
  color?: string;
  font?: string;
  scale?: number;
  background?: string;
  dpi?: number;
}

/**
 * 渲染 DXF 文字为高分辨率 CanvasSprite (调试版本)
 * 自动对齐到图纸场景
 * @param {Object} viewer - dxf-viewer 实例
 * @param {Object} options
 *    color - 文字颜色
 *    font - Canvas 字体
 *    scale - Sprite 缩放比例
 *    background - Canvas 背景色
 *    dpi - 放大比例，提高清晰度
 */
export function addTextSprites(viewer: any, options: TextSpriteOptions = {}) {
  const dxf = viewer.parsedDxf;
  const scene = viewer.scene || viewer.viewer?.scene;
  if (!dxf || !scene) {
    log.debug('Missing dxf or scene:', { dxf: !!dxf, scene: !!scene });
    return;
  }

  const {
    color = '#000000',
    font = '20px Microsoft YaHei',
    scale = 0.01,
    background = 'transparent',
    dpi = 4,
  } = options;

  // 打印调试信息
  log.debug('DXF entities count:', dxf.entities?.length || 0);
  log.debug('Scene children count:', scene.children?.length || 0);

  // 遍历文字实体
  const textEntities = dxf.entities.filter(
    (e: any) => e.type === 'TEXT' || e.type === 'MTEXT',
  );

  log.debug('Found text entities:', textEntities.length);
  log.debug('Text entities data:', textEntities);

  textEntities.forEach((entity: any, index: number) => {
    const text = entity.text?.trim();
    if (!text) return;

    log.debug(`Processing text entity ${index}:`, {
      text,
      type: entity.type,
      position: entity.position,
      startPoint: entity.startPoint,
      insertionPoint: entity.insertionPoint,
      alignmentPoint: entity.alignmentPoint,
      height: entity.height,
      rotation: entity.rotation,
    });

    // 创建高分辨率 Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.font = font;
    const textWidth = ctx.measureText(text).width;
    const canvasWidth = (textWidth + 10) * dpi;
    const canvasHeight = 40 * dpi;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx.scale(dpi, dpi);

    ctx.font = font;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvasWidth / dpi, canvasHeight / dpi);
    ctx.fillStyle = color;

    // 根据DXF文字对齐方式设置画布对齐
    let textAlign = 'left'; // 默认左对齐
    let textBaseline = 'middle'; // 默认中间对齐

    // 处理DXF文字对齐方式
    if (entity.halign !== undefined) {
      switch (entity.halign) {
        case 0:
          textAlign = 'left';
          break;
        case 1:
          textAlign = 'center';
          break;
        case 2:
          textAlign = 'right';
          break;
        default:
          textAlign = 'left';
      }
    }

    if (entity.valign !== undefined) {
      switch (entity.valign) {
        case 0:
          textBaseline = 'alphabetic';
          break;
        case 1:
          textBaseline = 'bottom';
          break;
        case 2:
          textBaseline = 'middle';
          break;
        case 3:
          textBaseline = 'top';
          break;
        default:
          textBaseline = 'middle';
      }
    }

    ctx.textAlign = textAlign as any;
    ctx.textBaseline = textBaseline as any;

    // 根据对齐方式调整文字位置
    let drawX = 5;
    let drawY = canvasHeight / dpi / 2;

    if (textAlign === 'center') {
      drawX = canvasWidth / dpi / 2;
    } else if (textAlign === 'right') {
      drawX = canvasWidth / dpi - 5;
    }

    ctx.fillText(text, drawX, drawY);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });
    const sprite = new THREE.Sprite(material);

    // 获取文字位置 - 尝试多个可能的位置属性
    let textX = 0;
    let textY = 0;
    let textZ = 0;

    if (entity.position) {
      textX = entity.position.x || 0;
      textY = entity.position.y || 0;
      textZ = entity.position.z || 0;
    } else if (entity.startPoint) {
      textX = entity.startPoint.x || 0;
      textY = entity.startPoint.y || 0;
      textZ = entity.startPoint.z || 0;
    } else if (entity.insertionPoint) {
      textX = entity.insertionPoint.x || 0;
      textY = entity.insertionPoint.y || 0;
      textZ = entity.insertionPoint.z || 0;
    }

    log.debug(`Text "${text}" original position:`, { textX, textY, textZ });

    // 获取viewer的实际变换信息
    log.debug('Viewer options:', viewer.options);
    log.debug('Viewer transform info:', {
      camera: viewer.camera
        ? {
            position: viewer.camera.position,
            zoom: viewer.camera.zoom,
          }
        : null,
      scene: {
        position: scene.position,
        scale: scene.scale,
        children: scene.children.length,
      },
    });

    // 尝试获取DXF的原始边界框信息
    let dxfBounds = null;
    if (dxf.header && dxf.header.$EXTMIN && dxf.header.$EXTMAX) {
      dxfBounds = {
        min: dxf.header.$EXTMIN,
        max: dxf.header.$EXTMAX,
        width: dxf.header.$EXTMAX.x - dxf.header.$EXTMIN.x,
        height: dxf.header.$EXTMAX.y - dxf.header.$EXTMIN.y,
      };
      log.debug('DXF bounds:', dxfBounds);
    }

    // 检查第一个非Sprite几何体的实际坐标范围
    let geometryBounds: any = null;
    scene.traverse((child: any) => {
      if (
        !geometryBounds &&
        child.geometry &&
        child.type !== 'Sprite' &&
        child.geometry.attributes
      ) {
        if (child.geometry.attributes.position) {
          const positions = child.geometry.attributes.position.array;
          let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity;

          // 确保正确遍历所有顶点
          for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];

            // 检查是否为有效数值
            if (typeof x === 'number' && !isNaN(x) && isFinite(x)) {
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
            }
            if (typeof y === 'number' && !isNaN(y) && isFinite(y)) {
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            }
          }

          // 只有在找到有效边界时才设置
          if (
            minX !== Infinity &&
            maxX !== -Infinity &&
            minY !== Infinity &&
            maxY !== -Infinity
          ) {
            geometryBounds = { minX, maxX, minY, maxY };
            log.debug('Geometry bounds:', geometryBounds);
          } else {
            log.debug('Invalid geometry bounds found, skipping this geometry');
          }
        }
      }
    });

    // 简化方案：基于几何体中心的相对定位
    let finalX = textX;
    let finalY = textY;
    let finalZ = textZ;

    if (geometryBounds) {
      const geoCenter = {
        x: (geometryBounds.minX + geometryBounds.maxX) / 2,
        y: (geometryBounds.minY + geometryBounds.maxY) / 2,
      };

      // 简单的相对定位：将文字放在几何体中心附近
      const scale = 0.3; // 固定缩放比例
      finalX = geoCenter.x + (textX - 200) * scale;
      finalY = geoCenter.y + (textY - 100) * scale;
      finalZ = 0;

      log.debug(
        `简化定位: 几何体中心=(${geoCenter.x.toFixed(2)}, ${geoCenter.y.toFixed(2)}), 文字位置=(${finalX.toFixed(2)}, ${finalY.toFixed(2)})`,
      );
    } else {
      // 没有几何体信息，使用备用缩放
      const fallbackScale = 0.01;
      finalX = textX * fallbackScale;
      finalY = textY * fallbackScale;
      finalZ = textZ * fallbackScale;
    }

    log.debug(
      `文字 "${text}" 最终坐标: (${finalX.toFixed(2)}, ${finalY.toFixed(
        2,
      )}, ${finalZ.toFixed(2)})`,
    );

    sprite.position.set(finalX, finalY, finalZ);

    log.debug(`Text "${text}" final position (after all transforms):`, {
      finalX,
      finalY,
      finalZ,
    });

    // 处理旋转
    if (entity.rotation) {
      sprite.rotation.z = -THREE.MathUtils.degToRad(entity.rotation);
      log.debug(
        `Text "${text}" rotation:`,
        entity.rotation,
        '-> sprite rotation:',
        sprite.rotation.z,
      );
    }

    // 设置缩放
    sprite.scale.set(
      (canvasWidth / dpi) * scale,
      (canvasHeight / dpi) * scale,
      1,
    );

    log.debug(`Text "${text}" sprite scale:`, sprite.scale);

    scene.add(sprite);
  });

  log.debug('Scene children after adding text sprites:', scene.children.length);
  viewer.render?.();
}
