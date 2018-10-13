import * as THREE from 'three'
import { Vector3 } from 'three'
import * as TWEEN from '@tweenjs/tween.js'
import axios from 'axios'
import Lyrics from 'lyrics.js'
import { Howl, Howler } from 'howler'
import { Group } from 'three'

export default function (element) {

  let camera, scene, renderer, font
  init()
  animate()

  let sound

  let lyricsLoaded = false
  let lyricTexts = []
  let lyricTextGroups = []
  let playtime = 0

  let data = []

  const IN_THRESHOLD = 0.5
  const OUT_THRESHOLD = 1.25
  const ON_SCREEN_THRESHOLD = 6
  const DEFAULT_EASING_TYPE = TWEEN.Easing.Quintic.InOut
  const DEFAULT_EASING_DURATION = 2000
  const LYRIC_GROUP_THRESHOLD = 10

  function getDefaultMaterial () {
    return new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    })
  }

  function init () {
    camera = new THREE.PerspectiveCamera(70, element.clientWidth / element.clientHeight, 1, 10000)
    camera.position.set(0, 0, 600)
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xffffff)

    const loader = new THREE.FontLoader()
    loader.load('/fonts/Neue.json', function (_font) {
      font = _font
      onLoaded()
    }) //end load function

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(1.5)
    renderer.setSize(element.clientWidth, element.clientHeight)

    element.appendChild(renderer.domElement)
    element.addEventListener('resize', onWindowResize, false)
  } // end init

  function onLoaded () {
    let lrcLoaded = false
    let dataLoaded = false

    axios.get('/test.lrc')
      .then(response => {
        const lrc = new Lyrics(response.data)
        console.log(lrc.getLyrics())
        lrc.getLyrics().forEach(it => spawnLyric(it))

        groupLyrics()

        lrcLoaded = true
        if (dataLoaded) {
          lyricsLoaded = true
        }
      })

    axios.get('/test.json')
      .then(response => {
        data = response.data

        dataLoaded = true
        if (lrcLoaded) {
          lyricsLoaded = true
        }
      })

    sound = new Howl({
      src: ['test.mp3']
    })

    sound.seek(8)
    sound.play()
    Howler.volume(0.5)
  }

  function spawnLyric (lyric) {
    const message = lyric.text
    const shapes = font.generateShapes(message, 50)

    let geometry = new THREE.ShapeBufferGeometry(shapes)
    geometry.computeBoundingBox()

    // Init object
    const text = new THREE.Mesh(geometry, getDefaultMaterial())
    text.position.z = 0
    text.material.opacity = 0

    // Align to center
    const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x)
    geometry.translate(xMid, 0, 0)

    // Init properties
    text.lyric = lyric
    text.inOutAnim = 0
    text.onScreenAnim = 0
    text.geometry = geometry

    lyricTexts.push(text)
  }

  function groupLyrics () {
    let group = new Group()
    for (let i = 0; i < lyricTexts.length; i++) {
      const it = lyricTexts[i]

      if (i > 0 && it.lyric.timestamp - lyricTexts[i - 1].lyric.timestamp > LYRIC_GROUP_THRESHOLD) {
        group.lastChildren = lyricTexts[i - 1]
        lyricTextGroups.push(group)
        group = new Group()
        group.layoutType = 0
        group.add(it)
        group.firstChildren = it
      } else {
        if (i === 0) {
          group.firstChildren = it
        }
        group.add(it)
      }
    }
    group.lastChildren = lyricTexts[lyricTexts.length - 1]
    lyricTextGroups.push(group)

    ////
    lyricTextGroups[0].layoutType = 0
    ////

    lyricTextGroups.forEach(it => buildGroupLayout(it))
  }

  function buildGroupLayout (group) {
    switch (group.layoutType) {
      case 0:
        break
      case 1:
        let left = true
        let dy = 0
        const dry = 0.314
        const margin = 20
        let totalHeight = 0
        group.children.forEach(text => {
          text.rotation.set(text.rotation.x, text.rotation.y + left ? dry : -dry, text.rotation.z)
          const width = text.geometry.boundingBox.max.x - text.geometry.boundingBox.min.x
          const height = text.geometry.boundingBox.max.y - text.geometry.boundingBox.min.y
          totalHeight += height + margin
          text.position.set(text.position.x + (width / 1500) * 200 * (left ? 1 : -1), text.position.y - dy, -300)
          dy += height + margin
          left = !left
        })
        group.totalHeight = totalHeight - margin
    }

    scene.add(group)
  }

  function renderLyricTexts () {
    if (playtime === 0) return

    for (let i = 0; i < lyricTexts.length; i++) {
      const it = lyricTexts[i]
      if (it.isKilled) continue

      // In/out
      if (!it.isSpawned && !it.isFadingIn) {

        if (it.lyric.timestamp - playtime < IN_THRESHOLD) {
          it.isSpawned = true
          animateIn(it)
          console.log(it.position)
        }

      } else if (it.isSpawned && !it.isFadingOut) {
        if (lyricTexts[Math.min(i + 1, lyricTexts.length - 1)].lyric.timestamp - playtime < OUT_THRESHOLD
          || playtime - it.lyric.timestamp > ON_SCREEN_THRESHOLD) {
          animateOut(it)
        }
      }

      // On screen
      if (it.isSpawned && !it.isKilled) {
        animateOnScreen(it)
      }
    }

    for (let i = 0; i < lyricTextGroups.length; i++) {
      const group = lyricTextGroups[i]

      if (!group.firstChildren.isSpawned || group.lastChildren.isKilled) continue

      animateGroup(group)
    }
  }

  function animateIn (text) {
    text.isFadingIn = true
    switch (text.inOutAnim) {
      case 0:
        const to = new Vector3(text.position.x, text.position.y, text.position.z)
        text.position.set(text.position.x, text.position.y - 20, text.position.z)

        animateVector3(text.position, to, {
          easing: DEFAULT_EASING_TYPE,
          duration: DEFAULT_EASING_DURATION,
        })
        tween(text.material, 1, {
          variable: 'opacity',
          easing: DEFAULT_EASING_TYPE,
          duration: DEFAULT_EASING_DURATION,
          callback: function () {
            text.isFadingIn = false
          }
        })
        break
    }
  }

  function animateOut (text) {
    text.isFadingOut = true
    switch (text.inOutAnim) {
      case 0:
        const to = new Vector3(text.position.x, text.position.y + 20, text.position.z)

        animateVector3(text.position, to, {
          easing: DEFAULT_EASING_TYPE,
          duration: DEFAULT_EASING_DURATION,
        })
        tween(text.material, 0, {
          variable: 'opacity',
          easing: DEFAULT_EASING_TYPE,
          duration: DEFAULT_EASING_DURATION,
          callback: function () {
            text.isFadingOut = false
            text.isKilled = true
            text.visible = false
          }
        })
        break
    }
  }

  function animateOnScreen (text) {
    switch (text.onScreenAnim) {
      case 0:
        text.scale.set(text.scale.x + 0.0005, text.scale.y + 0.0005, text.scale.z)
        break
    }
  }

  function animateGroup (group) {
    switch (group.layoutType) {
      case 0:
        break
      case 1:
        group.position.set(
          group.position.x,
          (playtime - group.firstChildren.lyric.timestamp) / (group.lastChildren.lyric.timestamp - group.firstChildren.lyric.timestamp) * group.totalHeight - 140,
          group.position.z
        )
        break
    }
  }

  function spawnPulse () {
    var material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.1,
    })

    var radius = 200
    var segments = 64 //<-- Increase or decrease for more resolution I guess

    var circleGeometry = new THREE.CircleGeometry(radius, segments)
    var circle = new THREE.Mesh(circleGeometry, material)
    circle.position.set(0, 0, -250)
    scene.add(circle)

    animateVector3(circle.position, new Vector3(0, 0, 500), {
      easing: TWEEN.Easing.Linear.None,
      duration: 2000
    })
    tween(circle.material,  0, {
      variable: 'opacity',
      easing: TWEEN.Easing.Linear.None,
      duration: 2000,
      callback: function () {
        scene.remove(circle);
      }
    })
  }

  let lastBeat = -1;

  function checkBeat () {
    while (lastBeat < data.beats.length && playtime >= data.beats[lastBeat + 1].start) {
      lastBeat++
      data.beats[lastBeat].processed = true
      spawnPulse()
    }
  }

  let lastSection = -1;

  function checkSection () {
    while (lastSection < data.sections.length && playtime >= data.sections[lastSection + 1].start) {
      lastSection++
      data.beats[lastSection].processed = true
      console.log("change section")
    }
  }

  function onWindowResize () {
    camera.aspect = element.clientWidth / element.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(element.clientWidth, element.clientHeight)
  }

  function animate (time) {
    requestAnimationFrame(animate)
    TWEEN.update(time)
    if (lyricsLoaded) {
      playtime = parseFloat(sound.seek()) || 0
      checkBeat()
      checkSection()
    }
    render()
  }

  function render () {
    renderer.render(scene, camera)
    if (lyricsLoaded) {
      renderLyricTexts()
    }
  }

  function animateVector3 (vectorToAnimate, target, options) {
    options = options || {}
    // get targets from options or set to defaults
    const to = target || THREE.Vector3(),
      easing = options.easing || TWEEN.Easing.Quadratic.In,
      duration = options.duration || 2000
    // create the tween
    const tweenVector3 = new TWEEN.Tween(vectorToAnimate)
      .to({ x: to.x, y: to.y, z: to.z, }, duration)
      .easing(easing)
      .onUpdate(function (d) {
        if (options.update) {
          options.update(d)
        }
      })
      .onComplete(function (d) {
        if (options.callback) options.callback(d)
      })
    // start the tween
    tweenVector3.start()
    // return the tween in case we want to manipulate it later on
    return tweenVector3
  }

  function tween (obj, target, options) {
    options = options || {}
    const easing = options.easing || TWEEN.Easing.Linear.None,
      duration = options.duration || 2000,
      variable = options.variable || 'opacity',
      tweenTo = {}
    tweenTo[variable] = target // set the custom variable to the target
    const tween = new TWEEN.Tween(obj)
      .to(tweenTo, duration)
      .easing(easing)
      .onUpdate(function (d) {
        if (options.update) {
          options.update(d)
        }
      })
      .onComplete(function (d) {
        if (options.callback) {
          options.callback(d)
        }
      })
    tween.start()
    return tween
  }

}
