import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
} from 'three'

export default function (element) {
  const scene = new Scene()
  const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

  const renderer = new WebGLRenderer()
  console.log(element)
  console.log(element.clientWidth, element.clientHeight)
  renderer.setSize(element.clientWidth, element.clientHeight)
  element.appendChild(renderer.domElement)

  const geometry = new BoxGeometry(1, 1, 1)
  const material = new MeshBasicMaterial({ color: 0x00ff00 })
  const cube = new Mesh(geometry, material)
  scene.add(cube)

  camera.position.z = 5

  const animate = function () {
    requestAnimationFrame(animate)

    cube.rotation.x += 0.01
    cube.rotation.y += 0.01

    renderer.render(scene, camera)
  }

  animate()
}
