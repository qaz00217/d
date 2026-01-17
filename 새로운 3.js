let lastResult = new Array(9).fill(0);

/* ===== 행렬 ===== */
let storedMatrix = [
    [1,0,0,0],
    [0,1,0,0],
    [0,0,1,0],
    [0,0,0,1]
];

let storedMatrix1 = [
    [1,0,0,0],
    [0,1,0,0],
    [0,0,1,0],
    [0,0,0,1]
];

/* ===== OBJ 데이터 ===== */
let vertices = [];
let uvs = [];
let normals = [];
let faceVertices = []; // 1차원 정점 스트림

/* ===== 화면 ===== */
const screenw = 480;
const screenh = 360;

let 화면z = new Float32Array(screenw * screenh);
let 화면uv = new Float32Array(screenw * screenh);
let 화면디퓨즈 = new Float32Array(screenw * screenh);
let 알파 = 0;
let 베타 = 0;
let 감마 = 0;
let 텍스처w = 128;
let 텍스처h = 128;
let w = 240;
let h = 180;
let verts=[[],[],[]];

function 알베감내적(a,b,c){
	return a*알파+b*베타+c*감마;
}
function 엣지(px,py,ax,ay,bx,by){
	return ((px-ax)*(by-ay))-((py-ay)*(bx-ax))
}
class MatrixBlocks {

    getInfo() {
        return {
            id: 'matrixBlocks',
            name: 'Software3D',
            blocks: [
                { opcode:'matrix', blockType:Scratch.BlockType.COMMAND, text:'월드 행렬 설정 [A]',
                  arguments:{A:{type:Scratch.ArgumentType.STRING, defaultValue:'[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]'}}},
                { opcode:'matrix1', blockType:Scratch.BlockType.COMMAND, text:'노멀 행렬 설정 [A]',
                  arguments:{A:{type:Scratch.ArgumentType.STRING, defaultValue:'[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]'}}},

                { opcode:'loadOBJFile', blockType:Scratch.BlockType.COMMAND, text:'OBJ 파일 불러오기' },
                { opcode:'renderAll', blockType:Scratch.BlockType.COMMAND, text:'전체 렌더링 실행' },
                { opcode:'getPixel디퓨즈', blockType:Scratch.BlockType.REPORTER, text:'픽셀 [i] 디퓨즈',
                  arguments:{i:{type:Scratch.ArgumentType.NUMBER, defaultValue:0}}},
                { opcode:'getPixeluv', blockType:Scratch.BlockType.REPORTER, text:'픽셀 [i] uv',
                  arguments:{i:{type:Scratch.ArgumentType.NUMBER, defaultValue:0}}},
                { opcode:'getPixel디버그', blockType:Scratch.BlockType.REPORTER, text:'픽셀 [i] 디버그',
                  arguments:{i:{type:Scratch.ArgumentType.NUMBER, defaultValue:0}}}
            ]
        };
    }

    /* ===== 행렬 ===== */
    matrix({A}){ storedMatrix = JSON.parse(A); }
    matrix1({A}){ storedMatrix1 = JSON.parse(A); }

    /* ===== 정점 변환 ===== */
    _transformVertex(x,y,z,u,v,nx,ny,nz){
        const pw =
            storedMatrix[3][0]*x +
            storedMatrix[3][1]*y +
            storedMatrix[3][2]*z +
            storedMatrix[3][3]*1;

        if(pw===0) return;

        const tx =
            storedMatrix[0][0]*x +
            storedMatrix[0][1]*y +
            storedMatrix[0][2]*z +
            storedMatrix[0][3]*1;

        const ty =
            storedMatrix[1][0]*x +
            storedMatrix[1][1]*y +
            storedMatrix[1][2]*z +
            storedMatrix[1][3]*1;

        const tz =
            storedMatrix[2][0]*x +
            storedMatrix[2][1]*y +
            storedMatrix[2][2]*z +
            storedMatrix[2][3]*1;

        lastResult[0] = Math.floor(w+0.5+(tx / pw)*w);
        lastResult[1] = Math.floor(h+-0.5+(ty / pw)*h);
        lastResult[2] = tz / pw;
		lastResult[3] = pw;
        lastResult[4] = u/ pw;
        lastResult[5] = (1-v)/ pw;

        lastResult[6] =
            (storedMatrix1[0][0]*nx +
            storedMatrix1[0][1]*ny +
            storedMatrix1[0][2]*nz)/ pw;

        lastResult[7] =
            (storedMatrix1[1][0]*nx +
            storedMatrix1[1][1]*ny +
            storedMatrix1[1][2]*nz)/ pw;

        lastResult[8] =
            (storedMatrix1[2][0]*nx +
            storedMatrix1[2][1]*ny +
            storedMatrix1[2][2]*nz)/ pw;
    }

    /* ===== OBJ ===== */
    async loadOBJFile(){
        const data = await new Promise(resolve=>{
            const i=document.createElement("input");
            i.type="file"; i.accept=".obj";
            i.onchange=()=>{
                const f=i.files[0];
                if(!f) return;
                const r=new FileReader();
                r.onload=()=>resolve(r.result);
                r.readAsText(f);
            };
            i.click();
        });
        this.parseOBJ(data);
    }

    parseOBJ(data){
        vertices=[]; uvs=[]; normals=[]; faceVertices=[];
        const lines=data.replace(/\r/g,'').split('\n');

        for(const l of lines){
            const s=l.trim();
            if(!s||s[0]==='#') continue;

            if(s.startsWith('v ')){
                const p=s.split(/\s+/);
                vertices.push([+p[1],+p[2],+p[3]]);
            }
            else if(s.startsWith('vt ')){
                const p=s.split(/\s+/);
                uvs.push([+p[1],+p[2]]);
            }
            else if(s.startsWith('vn ')){
                const p=s.split(/\s+/);
                normals.push([+p[1],+p[2],+p[3]]);
            }
            else if(s.startsWith('f ')){
                const p=s.split(/\s+/).slice(1).map(q=>{
                    const t=q.split('/');
                    return [(t[0]|0)-1,(t[1]?t[1]|0:-1)-1,(t[2]?t[2]|0:-1)-1];
                });
                for(let i=1;i<p.length-1;i++){
                    faceVertices.push(this.buildVertex(p[0]));
                    faceVertices.push(this.buildVertex(p[i]));
                    faceVertices.push(this.buildVertex(p[i+1]));
                }
            }
        }
    }

    buildVertex(i){
        const v=vertices[i[0]];
        const uv=i[1]>=0?uvs[i[1]]:[0,0];
        const n=i[2]>=0?normals[i[2]]:[0,0,1];
        return [v[0],v[1],v[2],uv[0],uv[1],n[0],n[1],n[2]];
    }

    /* ===== 렌더 ===== */
	clearFrame(){
		화면z.fill(Infinity);
		화면uv.fill(-1);
		화면디퓨즈.fill(0);
		// renderedPixels could be omitted or defined as an empty array
	}



    renderAll(){
        this.clearFrame();
        const triCount = faceVertices.length / 3;
        for(let t=0;t<triCount;t++){
            for(let k=0;k<3;k++){
				const v = faceVertices[t*3 + k];
				this._transformVertex(
					v[0],v[1],v[2],
					v[3],v[4],
					v[5],v[6],v[7]
				);
				verts[k]=[
				  lastResult[0], lastResult[1], lastResult[2],
				  lastResult[3], lastResult[4], lastResult[5],
				  lastResult[6], lastResult[7], lastResult[8]
				];
            }
            this.rasterTriangle(verts[0],verts[1],verts[2]);
        }
    }

	rasterTriangle(삼각형0,삼각형1,삼각형2){
		const [x0,y0,z0,w0,u0,v0,nx0,ny0,nz0]=삼각형0;
		const [x1,y1,z1,w1,u1,v1,nx1,ny1,nz1]=삼각형1;
		const [x2,y2,z2,w2,u2,v2,nx2,ny2,nz2]=삼각형2;
		
		const area=(x1-x0)*(y2-y0)-(y1-y0)*(x2-x0);
		if(area===0) return;

		const minX=Math.max(0,Math.floor(Math.min(x0,x1,x2)));
		const maxX=Math.min(screenw-1,Math.ceil(Math.max(x0,x1,x2)));
		const minY=Math.max(0,Math.floor(Math.min(y0,y1,y2)));
		const maxY=Math.min(screenh-1,Math.ceil(Math.max(y0,y1,y2)));


		for(let y=minY;y<=maxY;y++){
			for(let x=minX;x<=maxX;x++){
				알파=엣지(x1,y1,x2,y2,x,y);
				베타=엣지(x2,y2,x0,y0,x,y);
				감마=엣지(x0,y0,x1,y1,x,y);
				if (알파 >= 0 && 베타 >= 0 && 감마 >= 0) {
					알파/=area;
					베타/=area;
					감마/=area;
					const pbw = 알베감내적(1/w0,1/w1,1/w2);
					const z = 알베감내적(z0,z1,z2)/pbw;
					const grid = x + y * screenw;
					if (z >= 화면z[grid]) continue;
					const u = 알베감내적(u0,u1,u2)/pbw;
					const v = 알베감내적(v0,v1,v2)/pbw;
					const nx = 알베감내적(nx0,nx1,nx2)/pbw;
					const ny = 알베감내적(ny0,ny1,ny2)/pbw;
					const nz = 알베감내적(nz0,nz1,nz2)/pbw;
					const tx = Math.floor((0.5+(u*(텍스처w-1))));
					const ty = Math.floor((0.5+(v*(텍스처h-1))));
					const uv = (ty*텍스처w)+tx;
					const 디퓨즈 =1;

					화면uv[그리드]=uv;
					화면z[그리드]=z;
					화면디퓨즈[그리드]=디퓨즈;

				}
			}
		}
	}


    /* ===== 픽셀 출력 ===== */
    getPixeluv({i}){return 화면uv[i]}
    getPixel디퓨즈({i}){return 화면디퓨즈[i]}
	getPixel디버그({i}){return faceVertices[i]}
}

Scratch.extensions.register(new MatrixBlocks());
