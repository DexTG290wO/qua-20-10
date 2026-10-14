import * as THREE from 'three';

/**
 * Hình học hoa lá / ngôi sao dùng chung cho cả khu vườn, hạt bay
 * và hiệu ứng mở hộp quà — tất cả đều là hình học 3D thật, không
 * dùng hình vuông CSS.
 */

/** Cánh hoa cong, thuôn nhọn hai đầu — hình dáng tự nhiên. */
export function createPetalGeometry(
  length = 0.3,
  width = 0.2,
  curl = 0.07
): THREE.BufferGeometry {
  const geom = new THREE.PlaneGeometry(width, length, 8, 10);
  const pos = geom.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const nx = (pos.getX(i) / width) * 2; // -1..1
    const ny = Math.max(-1, Math.min(1, (pos.getY(i) / length) * 2)); // -1..1 (đã kẹp)

    // Thuôn hai đầu, phình ở giữa (kẹp giá trị để tránh NaN)
    const taper = Math.pow(Math.max(0, Math.sin((Math.PI * (ny + 1)) / 2)), 0.55);
    pos.setX(i, nx * (width / 2) * taper);

    // Cánh hoa hơi khum lại
    const cup = curl * (1 - nx * nx) - curl * 0.45 * ny * ny;
    pos.setZ(i, cup);
  }

  geom.computeVertexNormals();
  return geom;
}

/** Ngôi sao 4 cánh nhọn (lấp lánh). */
export function createFourPointStarGeometry(outer = 1, inner = 0.3): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const points = 4;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

/** Ngôi sao 5 cánh cổ điển. */
export function createFivePointStarGeometry(outer = 1, inner = 0.45): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const points = 5;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

/** Cánh hoa 3D dày (dùng cho hoa trong vườn). */
export function createThickPetalGeometry(
  length = 0.3,
  width = 0.22,
  thickness = 0.05
): THREE.BufferGeometry {
  const geom = createPetalGeometry(length, width, thickness * 0.5);
  // Nhân bản thành khối dày nhẹ để cánh hoa có độ sâu
  const extruded = new THREE.ExtrudeGeometry(
    (() => {
      const shape = new THREE.Shape();
      const seg = 10;
      shape.moveTo(0, -length / 2);
      for (let i = 1; i <= seg; i++) {
        const t = i / seg;
        const y = -length / 2 + t * length;
        const w = (width / 2) * Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.55);
        shape.lineTo(w, y);
      }
      for (let i = seg; i >= 0; i--) {
        const t = i / seg;
        const y = -length / 2 + t * length;
        const w = (width / 2) * Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.55);
        shape.lineTo(-w, y);
      }
      shape.closePath();
      return shape;
    })(),
    { depth: thickness, bevelEnabled: true, bevelSize: thickness * 0.6, bevelThickness: thickness * 0.4, bevelSegments: 2, curveSegments: 4 }
  );
  extruded.center();
  geom.dispose();
  return extruded;
}

/** Búi cỏ nhỏ gồm nhiều lá mảnh. */
export function createGrassTuftGeometry(
  blades = 7,
  height = 0.5
): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];
  for (let i = 0; i < blades; i++) {
    const blade = new THREE.PlaneGeometry(0.05, height, 1, 4);
    const pos = blade.attributes.position;
    const lean = (Math.random() - 0.5) * 0.5;

    for (let v = 0; v < pos.count; v++) {
      const y = pos.getY(v) + height / 2; // 0..height
      const t = y / height;
      pos.setX(v, pos.getX(v) * (1 - t * 0.85));
      pos.setZ(v, lean * t * t * height);
    }
    blade.computeVertexNormals();
    blade.rotateY(Math.random() * Math.PI);
    blade.translate((Math.random() - 0.5) * 0.16, height / 2, (Math.random() - 0.5) * 0.16);
    geometries.push(blade);
  }

  const merged = mergeBufferGeometries(geometries);
  return merged ?? geometries[0];
}

/** Gộp nhiều BufferGeometry cùng thuộc tính thành một (tránh phụ thuộc addon). */
export function mergeBufferGeometries(
  geometries: THREE.BufferGeometry[]
): THREE.BufferGeometry | null {
  if (geometries.length === 0) return null;

  let vertexCount = 0;
  let indexCount = 0;
  for (const g of geometries) {
    const pos = g.attributes.position;
    vertexCount += pos.count;
    indexCount += g.index ? g.index.count : pos.count;
  }

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices = new Uint32Array(indexCount);

  let vOffset = 0;
  let iOffset = 0;
  const hasNormals = geometries.every((g) => !!g.attributes.normal);
  const hasUvs = geometries.every((g) => !!g.attributes.uv);

  for (const g of geometries) {
    const pos = g.attributes.position;
    positions.set(pos.array as Float32Array, vOffset * 3);
    if (hasNormals) {
      normals.set(g.attributes.normal.array as Float32Array, vOffset * 3);
    }
    if (hasUvs) {
      uvs.set(g.attributes.uv.array as Float32Array, vOffset * 2);
    }

    if (g.index) {
      const idx = g.index.array;
      for (let i = 0; i < idx.length; i++) indices[iOffset + i] = idx[i] + vOffset;
      iOffset += idx.length;
    } else {
      for (let i = 0; i < pos.count; i++) indices[iOffset + i] = i + vOffset;
      iOffset += pos.count;
    }
    vOffset += pos.count;
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  if (hasNormals) out.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  if (hasUvs) out.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  out.setIndex(new THREE.BufferAttribute(indices, 1));
  if (!hasNormals) out.computeVertexNormals();

  for (const g of geometries) g.dispose();
  return out;
}
