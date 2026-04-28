/*
 * Copyright (c) 2025 BaseMetas
 *
 * All rights reserved.
 *
 * This software and its source code are proprietary and confidential to
 * BaseMetas. You may not use, copy, modify, distribute, sublicense, or
 * otherwise exploit this software except with the prior written permission
 * of BaseMetas.
 */

/**
 * 检测浏览器是否支持 WASM Bulk Memory Operations 特性
 *
 * Bulk Memory Operations（包含 memory.init, memory.copy, memory.fill,
 * data.drop 等指令及 DataCount 段）需要：
 * - Chrome 75+
 * - Firefox 72+
 * - Safari 13.1+
 * - Edge 79+
 *
 * Chrome 68 等旧版浏览器无法编译包含 DataCount 段的 WASM 模块，
 * 会抛出 CompileError: "unexpected section"
 */
let _bulkMemorySupported: boolean | null = null;

export function isWasmBulkMemorySupported(): boolean {
  if (_bulkMemorySupported !== null) {
    return _bulkMemorySupported;
  }

  try {
    // 尝试编译一个包含 DataCount 段（section id=12）的极简 WASM 模块
    // DataCount 段是 Bulk Memory Operations 提案的一部分，
    // 不支持的浏览器会抛出 CompileError
    //
    // 模块结构: Type(1) + Function(3) + Memory(5) + DataCount(12) + Code(10) + Data(11)
    // Base64 编码避免超长 Uint8Array 字面量触发 Prettier 换行
    const base64 = 'AGFzbQEAAAABBAFgAAADAgEABQMBAAEMAQEKBAECAAsLAwEBAA==';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const module = new WebAssembly.Module(bytes);
    _bulkMemorySupported = module instanceof WebAssembly.Module;
  } catch {
    _bulkMemorySupported = false;
  }

  return _bulkMemorySupported;
}
