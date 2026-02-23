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

import { useEffect, useRef } from 'react';
import { renderProps, IMode } from '@/types';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader.js';
import { TDSLoader } from 'three/examples/jsm/loaders/TDSLoader.js';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader.js';
import styles from './index.module.scss';
import { useLoading } from '@/hooks/loading';
import Footer from '@/components/footer';
import { getAppContext, log } from '@/utils';
const webPrefix = getAppContext() + '/preview';

export default function ThreeDRender(props: renderProps) {
  const {
    fileName,
    src: url = '',
    previewFileFormat,
    displayName = '',
    mode = IMode.normal,
  } = props;
  const mountRef = useRef<HTMLDivElement>(null);
  const { hideLoading, showLoadingError } = useLoading();

  useEffect(() => {
    if (!url) return;
    const mount = mountRef.current!;
    const scene = new THREE.Scene();

    // 根据文件类型设置背景，这里要根据实际文件名处理
    // const ext = url.split('.').pop()?.toLowerCase();
    const ext = previewFileFormat;
    scene.background = new THREE.Color(0xffffff);

    // 渲染器配置
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // 摄像机
    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      2000,
    );
    camera.position.set(3, 3, 3);

    // 控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 光照配置（自然光照方案）
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // 主灯光 - 正上方光源
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(0, 50, 0); // 正上方
    mainLight.castShadow = false; // 可根据需要开启阴影
    scene.add(mainLight);

    // 补充光（提供方向感）
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-10, 5, -10);
    scene.add(fillLight);

    // 自动缩放居中（优先调整相机，保持模型原始位置）
    const fitCameraToObject = (object: THREE.Object3D) => {
      // 关键修复：强制更新所有子对象的世界矩阵
      object.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(object);
      if (box.isEmpty()) return;

      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      // 计算包围球半径
      const boundingSphereRadius =
        Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z) * 0.5;

      // 使用 Three.js 标准方法：根据 FOV 和包围球计算距离
      const fov = camera.fov * (Math.PI / 180);
      // 这是标准公式：确保球体完全在视锥体内，乘以 1.3 增加留白
      const cameraDistance = (boundingSphereRadius / Math.sin(fov / 2)) * 1.3;

      // 设置相机位置（从正前偏上方观察）
      const direction = new THREE.Vector3(1, 1, 2).normalize();
      camera.position
        .copy(center)
        .add(direction.multiplyScalar(cameraDistance));

      // 相机对准模型中心
      camera.lookAt(center);
      camera.up.set(0, 1, 0);
      camera.updateProjectionMatrix();

      // 设置控制器
      controls.target.copy(center);
      controls.update();
    };

    // 添加模型到场景
    const addToScene = (object: THREE.Object3D) => {
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (
            child.material &&
            child.material instanceof THREE.MeshBasicMaterial
          ) {
            child.material = new THREE.MeshStandardMaterial({
              color: child.material.color,
              map: child.material.map,
              transparent: child.material.transparent,
              opacity: child.material.opacity,
              metalness: 0.1,
              roughness: 0.8,
            });
          }
        }
      });

      // 先调整相机和模型位置，再添加到场景，减少视觉跳跃
      fitCameraToObject(object);
      scene.add(object);
      hideLoading();
    };

    const onError = (err: any) => {
      log.error('模型加载失败:', err);
      showLoadingError();
    };

    // Loader 分发
    let loader: any;
    switch (ext) {
      case 'gltf':
      case 'glb':
        loader = new GLTFLoader();
        loader.load(
          url,
          (gltf: any) => addToScene(gltf.scene),
          undefined,
          onError,
        );
        break;
      case 'obj':
        loader = new OBJLoader();
        loader.load(url, addToScene, undefined, onError);
        break;
      case 'stl':
        loader = new STLLoader();
        loader.load(
          url,
          (geo: any) =>
            addToScene(
              new THREE.Mesh(
                geo,
                new THREE.MeshStandardMaterial({ color: 0x4a90e2 }),
              ),
            ),
          undefined,
          onError,
        );
        break;
      case 'fbx':
        loader = new FBXLoader();
        loader.load(url, addToScene, undefined, onError);
        break;
      case 'ply':
        loader = new PLYLoader();
        loader.load(
          url,
          (geo: any) => {
            geo.computeVertexNormals();
            addToScene(
              new THREE.Mesh(
                geo,
                new THREE.MeshStandardMaterial({ color: 0x0088aa }),
              ),
            );
          },
          undefined,
          onError,
        );
        break;
      case 'dae':
        loader = new ColladaLoader();
        loader.load(
          url,
          (res: any) => addToScene(res.scene),
          undefined,
          onError,
        );
        break;
      case 'wrl':
        loader = new VRMLLoader();
        loader.load(url, addToScene, undefined, onError);
        break;
      case '3ds':
        loader = new TDSLoader();
        loader.load(url, addToScene, undefined, onError);
        break;
      case '3mf':
        loader = new ThreeMFLoader();
        loader.load(url, addToScene, undefined, onError);
        break;
      case '3dm': {
        // 检测 Chrome 版本，91 以下不支持新版 WASM
        const userAgent = navigator.userAgent;
        const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
        if (chromeMatch && parseInt(chromeMatch[1]) < 91) {
          log.error('⚠️ Chrome 版本过低，不支持 .3dm 文件');
          showLoadingError(
            '不支持的格式',
            '当前浏览器版本过低，.3dm 格式需要 Chrome 91+',
          );
          break;
        }

        loader = new Rhino3dmLoader();
        loader.setLibraryPath(`${webPrefix}/vendor/rhino3dm/`); // 本地 rhino3dm.wasm 位置
        loader.load(
          url,
          (object: any) => {
            // Rhino 使用 Z-up 坐标系，需要旋转到 Y-up
            object.rotation.x = -Math.PI / 2;
            addToScene(object);
          },
          undefined,
          onError,
        );
        break;
      }
      default:
        log.warn('⚠️ 不支持的文件格式:', ext);
    }

    // 渲染循环
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationId) cancelAnimationFrame(animationId);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [hideLoading, previewFileFormat, showLoadingError, url]);

  return (
    <div className={styles.pageContainer}>
      {mode === IMode.normal && (
        <div className={styles.topbar}>{displayName || fileName}</div>
      )}
      <div className={styles.pageCanvas} ref={mountRef}></div>
      <Footer {...props} />
    </div>
  );
}
