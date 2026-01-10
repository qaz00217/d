(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Sandbox OFF 필요');
  }

  let wasm;
  let memory;

  // WASM 파일을 fetch해서 로딩
  WebAssembly.instantiateStreaming(fetch('https://raw.githubusercontent.com/qaz00217/d/main/vector3d.wasm')
, { env: {} })
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

      // 3개의 float 공간 malloc
      const ptr = wasm._malloc(3 * 4); // float32 = 4바이트

      // WASM 함수 호출
      wasm.add3(args.AX, args.AY, args.AZ,
               args.BX, args.BY, args.BZ,
               ptr);

      // 메모리 읽기
      const f32 = new Float32Array(memory.buffer, ptr, 3);
      const result = `${f32[0]}, ${f32[1]}, ${f32[2]}`;

      // 메모리 해제
      wasm._free(ptr);

      return result;
    }
  }

  Scratch.extensions.register(new Vector3DWasm());
})(Scratch);
