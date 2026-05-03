import * as THREE from 'three'

export interface BuiltinModel {
  id: string
  label: string
  emoji: string
  create: () => THREE.Object3D
}

function mat(color: string | number, metalness = 0.3, roughness = 0.5): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness })
}

function createBox(): THREE.Object3D {
  const group = new THREE.Group()
  group.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat(0x6c63ff)))
  return group
}

function createSphere(): THREE.Object3D {
  const group = new THREE.Group()
  group.add(new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 32), mat(0xff6584, 0.5, 0.3)))
  return group
}

function createTorus(): THREE.Object3D {
  const group = new THREE.Group()
  group.add(new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.2, 32, 64), mat(0x00e676, 0.6, 0.2)))
  return group
}

function createCylinder(): THREE.Object3D {
  const group = new THREE.Group()
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 32), mat(0xffd600, 0.4, 0.4)))
  return group
}

function createCone(): THREE.Object3D {
  const group = new THREE.Group()
  group.add(new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 32), mat(0xff9100, 0.3, 0.6)))
  return group
}

function createDiamond(): THREE.Object3D {
  const group = new THREE.Group()
  // Octahedron as a diamond shape
  const geo = new THREE.OctahedronGeometry(0.7)
  // Flatten top
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0.3) {
      pos.setY(i, pos.getY(i) * 0.5)
    }
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  group.add(new THREE.Mesh(geo, mat(0x40c4ff, 0.1, 0.05)))
  return group
}

function createKnot(): THREE.Object3D {
  const group = new THREE.Group()
  group.add(new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.4, 0.12, 100, 16),
    mat(0xe040fb, 0.7, 0.1),
  ))
  return group
}

function createPyramid(): THREE.Object3D {
  const group = new THREE.Group()
  group.add(new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 4), mat(0xffab40, 0.2, 0.7)))
  return group
}

function createCapsule(): THREE.Object3D {
  const group = new THREE.Group()
  group.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.7, 12, 24), mat(0x26c6da, 0.3, 0.3)))
  return group
}

export const BUILTIN_MODELS: BuiltinModel[] = [
  { id: 'box', label: 'Box', emoji: '⬛', create: createBox },
  { id: 'sphere', label: 'Sphere', emoji: '🔵', create: createSphere },
  { id: 'torus', label: 'Torus', emoji: '⭕', create: createTorus },
  { id: 'cylinder', label: 'Cylinder', emoji: '🔷', create: createCylinder },
  { id: 'cone', label: 'Cone', emoji: '🔺', create: createCone },
  { id: 'diamond', label: 'Diamond', emoji: '💎', create: createDiamond },
  { id: 'knot', label: 'Knot', emoji: '🌀', create: createKnot },
  { id: 'pyramid', label: 'Pyramid', emoji: '△', create: createPyramid },
  { id: 'capsule', label: 'Capsule', emoji: '💊', create: createCapsule },
]
