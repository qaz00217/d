(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Sandbox OFF 필요');
  }

  let wasm;
  let memory;

  // 🔽 여기다가 vector3d.wasm을 Base64로 변환해서 붙여넣기
  const wasmBase64 = "AGFzbQEAAAABDANgAABgAAF/YAF/AAMJCAAAAAEBAQIBBAUBcAECAgUGAQGBAoECBhIDfwFBgIAEC38BQQALfwFBAAsH2gEJBm1lbW9yeQIAC19pbml0aWFsaXplAAEZX19pbmRpcmVjdF9mdW5jdGlvbl90YWJsZQEAFWVtc2NyaXB0ZW5fc3RhY2tfaW5pdAACGWVtc2NyaXB0ZW5fc3RhY2tfZ2V0X2ZyZWUAAxllbXNjcmlwdGVuX3N0YWNrX2dldF9iYXNlAAQYZW1zY3JpcHRlbl9zdGFja19nZXRfZW5kAAUZX2Vtc2NyaXB0ZW5fc3RhY2tfcmVzdG9yZQAGHGVtc2NyaXB0ZW5fc3RhY2tfZ2V0X2N1cnJlbnQABwkHAQBBAQsBAApyCAQAEAILFAACQEGBgICAAEUNABCAgICAAAsLIABBgICEgAAkgoCAgABBgICAgABBD2pBcHEkgYCAgAALDwAjgICAgAAjgYCAgABrCwgAI4KAgIAACwgAI4GAgIAACwoAIAAkgICAgAALCAAjgICAgAALAJQBD3RhcmdldF9mZWF0dXJlcwgrC2J1bGstbWVtb3J5Kw9idWxrLW1lbW9yeS1vcHQrFmNhbGwtaW5kaXJlY3Qtb3ZlcmxvbmcrCm11bHRpdmFsdWUrD211dGFibGUtZ2xvYmFscysTbm9udHJhcHBpbmctZnB0b2ludCsPcmVmZXJlbmNlLXR5cGVzKwhzaWduLWV4dA==";


  const wasmBytes = Uint8Array.from(atob(wasmBase64), c => c.charCodeAt(0));

  WebAssembly.instantiate(wasmBytes, { env: {} })
    .then(result => {
      wasm = result.instance.exports;
      memory = wasm.memory;
      console.log('WASM 로드 성공', wasm);
    })
    .catch(e => console.error('WASM 로드 실패', e));

  class Vector3DWasm {
    getInfo() {
      return {
        id: 'vector3dWasm',
        name: 'Vector3D WASM',
        blocks: [
          {
            opcode: 'add3',
            blockType: Scratch.BlockType.REPORTER,
            text: '[AX] [AY] [AZ] + [BX] [BY] [BZ]',
            arguments: {
              AX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              AY: { type: Scratch.ArgumentType.NUMBER, defaultValue: 2 },
              AZ: { type: Scratch.ArgumentType.NUMBER, defaultValue: 3 },
              BX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 4 },
              BY: { type: Scratch.ArgumentType.NUMBER, defaultValue: 5 },
              BZ: { type: Scratch.ArgumentType.NUMBER, defaultValue: 6 }
            }
          }
        ]
      };
    }

    add3(args) {
      if (!wasm) return 'WASM 로딩중';

      const ptr = wasm._malloc(3 * 4); // float32 = 4바이트
      wasm.add3(args.AX, args.AY, args.AZ,
               args.BX, args.BY, args.BZ,
               ptr);
      const f32 = new Float32Array(memory.buffer, ptr, 3);
      const result = `${f32[0]}, ${f32[1]}, ${f32[2]}`;
      wasm._free(ptr);
      return result;
    }
  }

  Scratch.extensions.register(new Vector3DWasm());
})(Scratch);
