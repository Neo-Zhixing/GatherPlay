import * as THREE from 'three'
import { Group, Vector3 } from 'three'
import * as TWEEN from '@tweenjs/tween.js'
import axios from 'axios'
import Lyrics from 'lyrics.js'
import { Howl, Howler } from 'howler'

export default function (element) {
  let camera, scene, renderer, font
  init()
  animate()

  let sound

  let visualizationDataLoaded = false
  let lyricTexts = []
  let lyricTextGroups = []
  let currentLyric = null
  let currentGroup = null
  let lookingAtLyric = null
  let playtime = 0

  let data = []

  let useLrcSections = false
  const DEFAULT_EASING_TYPE = TWEEN.Easing.Quadratic.InOut
  const DEFAULT_EASING_DURATION = 800
  const LYRIC_GROUP_THRESHOLD = 10

  function getDefaultMaterial () {
    return new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      side: THREE.FrontSide
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
    }) // end load function

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

        lrcLoaded = true
        if (dataLoaded) {
          onVisualizationDataLoaded()
        }
      })

    axios.get('/test.json')
      .then(response => {
        data = response.data

        dataLoaded = true
        if (lrcLoaded) {
          onVisualizationDataLoaded()
        }
      })

    sound = new Howl({
      src: ['test.mp3']
    })

    sound.seek(8)
    sound.play()
    Howler.volume(0.5)
  }

  function onVisualizationDataLoaded () {
    groupLyrics()
    visualizationDataLoaded = true
  }

  let useLrcSectionsConfidence = 0

  function spawnLyric (lyric) {
    const message = lyric.text
    const shapes = font.generateShapes(message, 50)

    let geometry = new THREE.ShapeGeometry(shapes)
    geometry.computeBoundingBox()

    // Init object
    const text = new THREE.Mesh(geometry, getDefaultMaterial())
    text.position.z = 0
    text.visible = false
    text.material.depthTest = false

    // Align to center
    const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x)
    geometry.translate(xMid, 0, 0)

    // Init properties
    text.lyric = lyric
    text.inOutAnim = 0
    text.onScreenAnim = 0
    text.geometry = geometry
    text.inThreshold = 0.5
    text.outThreshold = 1.25
    text.onScreenThresHold = 6

    if (isWhitespace(lyric.text)) {
      useLrcSectionsConfidence++
      if (useLrcSectionsConfidence >= 2) {
        // Let the .lrc does section division
        useLrcSections = true
      }
    }

    lyricTexts.push(text)
  }

  function groupLyrics () {
    let group = new Group()
    for (let i = 0; i < lyricTexts.length; i++) {
      const it = lyricTexts[i]

      let isNextSection = false

      if (useLrcSections) {
        if (isWhitespace(it.lyric.text)) {
          isNextSection = true
        }
      } else {
        if (!isNextSection) {
          if (i > 0 && it.lyric.timestamp - lyricTexts[i - 1].lyric.timestamp > LYRIC_GROUP_THRESHOLD) {
            isNextSection = true
          }
        }

        if (!isNextSection) {
          let lastSection = -1
          while (lastSection + 1 < data.sections.length && it.lyric.timestamp >= data.sections[lastSection + 1].start) {
            lastSection++

            if (!data.sections[lastSection].processed) {
              data.sections[lastSection].processed = true
              isNextSection = true
            }
          }
        }
      }

      if (i > 0 && isNextSection) {
        lyricTextGroups.push(group)
        group = new Group()
        group.layoutType = 0
      }
      group.add(it)
      it.group = group

    }
    lyricTextGroups.push(group)

    lyricTextGroups.forEach(group => {
      group.firstChildren = group.children[0]
      group.lastChildren = group.children[group.children.length - 1]
    })

    let i = 0
    lyricTextGroups.forEach(group => {

      let segments = 0
      while (segments < data.segments.length && data.segments[segments].start < group.firstChildren.lyric.timestamp) {
        segments++
      }

      let loudness_sum = 0
      let startSegment = segments
      while (segments < data.segments.length && data.segments[segments].start < (i + 1 === lyricTextGroups.length ? Number.MAX_VALUE : lyricTextGroups[i + 1].firstChildren.lyric.timestamp)) {
        loudness_sum += data.segments[segments].loudness_max
        segments++
      }

      group.avg_loudness = loudness_sum / (segments - startSegment)

      i++
    })

    lyricTextGroups.forEach(group => {
      while (group.firstChildren && isWhitespace(group.firstChildren.lyric.text)) {
        group.remove(group.firstChildren)
        group.firstChildren.remove()
        group.firstChildren = null

        group.firstChildren = group.children[0]
      }
    })

    lyricTextGroups.forEach(group => {
      if (group.children.length === 0) {
        lyricTextGroups = lyricTextGroups.filter(it => it !== group)
      }
    })

    i = 0
    lyricTextGroups.forEach(group => {
      console.log('Group #' + i++)
      console.log(group.avg_loudness)
      buildGroupLayout(group)
    })
  }

  var totalChorusLayout = 1
  var totalVerseLayout = 2
  var currentChorusLayout = 0
  var currentVerseLayout = totalChorusLayout + 1

  function buildGroupLayout (group) {
    if (isChorus(group)) {
      group.layoutType = currentChorusLayout
      currentChorusLayout++
      if (currentChorusLayout === totalChorusLayout) currentChorusLayout = 0
    } else {
      group.layoutType = currentVerseLayout
      currentVerseLayout++
      if (currentVerseLayout === totalVerseLayout + totalChorusLayout) currentVerseLayout = totalChorusLayout
    }

    if (group.layoutType === 0) {
      group.children.forEach(text => {
        text.position.set(text.position.x, text.position.y, -200)
        text.onScreenAnim = 1
      })
    } else if (group.layoutType === 1) {
      let left = true
      const dry = 0.314
      const margin = 20
      let totalHeight = 0
      group.children.forEach(text => {
        text.rotation.set(text.rotation.x, text.rotation.y + left ? dry : -dry, text.rotation.z)
        const width = text.geometry.boundingBox.max.x - text.geometry.boundingBox.min.x
        const height = text.geometry.boundingBox.max.y - text.geometry.boundingBox.min.y
        totalHeight += height + margin
        text.position.set(text.position.x + (width / 1500) * 150 * (left ? 1 : -1), text.position.y, -300)
        left = !left

        text.onScreenAnim = 1
      })
    } else if (group.layoutType === 2) {
      let left = true
      const margin = 100
      let totalHeight = 0
      let j = 0
      group.children.forEach(text => {
        const width = text.geometry.boundingBox.max.x - text.geometry.boundingBox.min.x
        const height = text.geometry.boundingBox.max.y - text.geometry.boundingBox.min.y
        text.position.set(text.position.x + (width / 4 * (left ? -1 : 1)) + (left ? 75 : -75), text.position.y - totalHeight, -400)
        totalHeight += height + margin
        left = !left

        text.inThreshold = 0.5
        text.outThreshold = (j < group.children.length - 1) ? (1.25 - 2) : 1.25
        text.onScreenThresHold = 6 + 2
        text.onScreenAnim = 0
        text.inOutAnim = 1

        j++
      })
      group.totalHeight = totalHeight
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
        if (it.lyric.timestamp - playtime < it.inThreshold) {
          it.isSpawned = true
          it.visible = true

          currentLyric = it
          currentGroup = it.group

          animateIn(it)
        }
      } else if (it.isSpawned && !it.isFadingOut) {
        if (lyricTexts[Math.min(i + 1, lyricTexts.length - 1)].lyric.timestamp - playtime < it.outThreshold ||
          playtime - it.lyric.timestamp > it.onScreenThresHold) {
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
    let to = new Vector3(text.position.x, text.position.y, text.position.z)

    // Store original location
    text.originalPosition = new Vector3()
    text.getWorldPosition(text.originalPosition)

    if (text.inOutAnim === 0) {
      text.position.set(text.position.x, text.position.y - 25, text.position.z)
    } else if (text.inOutAnim === 1) {
      text.position.set(text.position.x - 100, text.position.y, text.position.z)
    }
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
  }

  function animateOut (text) {
    text.isFadingOut = true
    let to
    if (text.inOutAnim === 0) {
      to = new Vector3(text.position.x, text.position.y + 25, text.position.z)
    } else if (text.inOutAnim === 1) {
      to = new Vector3(text.position.x + 100, text.position.y, text.position.z)
    }
    animateVector3(text.position, to, {
      easing: DEFAULT_EASING_TYPE,
      duration: DEFAULT_EASING_DURATION,
    })

    tween(text.material, 0, {
      variable: 'opacity',
      easing: DEFAULT_EASING_TYPE,
      duration: DEFAULT_EASING_DURATION,
      update: function () {
        if (!text.isKilled && text.position.distanceTo(to) < 2) {
          text.isFadingOut = false
          text.isKilled = true
          text.visible = false
          text.position.set(0, 0, 1000)

          scene.remove(text)
        }
      },
    })
  }

  function animateOnScreen (text) {
    if (text.onScreenAnim === 0) {

    } else if (text.onScreenAnim === 1) {
      text.scale.set(text.scale.x + 0.001, text.scale.y + 0.001, text.scale.z)
    }
  }

  function animateGroup (group) {
    if (group.layoutType === 0) {
    } else if (group.layoutType === 1) {
    } else if (group.layoutType === 2) {
      group.position.set(
        group.position.x,
        (playtime - group.firstChildren.lyric.timestamp) / (group.lastChildren.lyric.timestamp - group.firstChildren.lyric.timestamp) * group.totalHeight - 150,
        group.position.z
      )
    }
  }

  function spawnPulse () {
    var material = new THREE.MeshBasicMaterial({
      color: isChorus() ? 0x256eff : 0x000000,
      transparent: true,
      opacity: isChorus() ? 0.2 : 0.1,
    })

    var radius = 200
    var segments = 64 // <-- Increase or decrease for more resolution I guess

    var circleGeometry = new THREE.CircleGeometry(radius, segments)
    var circle = new THREE.Mesh(circleGeometry, material)
    circle.position.set(0, 0, -250 * (isChorus() ? 0.5 : 1))
    scene.add(circle)

    animateVector3(circle.position, new Vector3(0, 0, 500 * (isChorus() ? 1.33 : 1)), {
      easing: TWEEN.Easing.Linear.None,
      duration: 2000
    })
    tween(circle.material, 0, {
      variable: 'opacity',
      easing: TWEEN.Easing.Linear.None,
      duration: 2000,
      callback: function () {
        scene.remove(circle)
      }
    })
  }

  let lastBeat = -1

  function checkBeat () {
    while (lastBeat + 1 < data.beats.length && playtime >= data.beats[lastBeat + 1].start) {
      lastBeat++
      data.beats[lastBeat].processed = true

      if (playtime - data.beats[lastBeat].start < 1) spawnPulse()
    }
  }

  function isChorus (group) {
    if (group == null) group = currentGroup
    return group != null && group.avg_loudness > data.track.loudness
  }

  function onWindowResize () {
    camera.aspect = element.clientWidth / element.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(element.clientWidth, element.clientHeight)
  }

  function animate (time) {
    requestAnimationFrame(animate)
    TWEEN.update(time)
    if (visualizationDataLoaded) {
      playtime = parseFloat(sound.seek()) || 0
      checkBeat()
    }
    render()
  }

  let completedTween = true

  function render () {
    renderer.render(scene, camera)
    if (visualizationDataLoaded) {
      renderLyricTexts()
      if (currentLyric != null && lookingAtLyric !== currentLyric) {
        lookingAtLyric = currentLyric
        const from = new THREE.Quaternion().copy(camera.quaternion)

        camera.lookAt(lookingAtLyric.originalPosition)

        const to = new THREE.Quaternion().copy(camera.quaternion)

        camera.quaternion.set(from._x, from._y, from._z, from._w);

        completedTween = false

        new TWEEN.Tween(camera.quaternion)
          .to(to, 1000)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .onComplete(data => {
            completedTween = true
          })
          .start()
      } else if (completedTween) {

      }
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
      .to({ x: to.x, y: to.y, z: to.z }, duration)
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

  function isWhitespace (string) {
    return !string.replace(/\s/g, '').length
  }
}
