import * as THREE from 'three'
import { Group, Vector3 } from 'three'
import * as TWEEN from '@tweenjs/tween.js'
import Lyrics from 'lyrics.js'
import * as Vibrant from 'node-vibrant'

export let playtime = 0

const pSBC = function (p, from, to) {
  if (typeof (p) !== 'number' || p < -1 || p > 1 || typeof (from) !== 'string' || (from[0] != 'r' && from[0] != '#') || (to && typeof (to) !== 'string')) return null // ErrorCheck
  const pSBCr = (d) => {
    let l = d.length, RGB = {}
    if (l > 9) {
      d = d.split(',')
      if (d.length < 3 || d.length > 4) return null// ErrorCheck
      RGB[0] = i(d[0].split('(')[1]), RGB[1] = i(d[1]), RGB[2] = i(d[2]), RGB[3] = d[3] ? parseFloat(d[3]) : -1
    } else {
      if (l == 8 || l == 6 || l < 4) return null // ErrorCheck
      if (l < 6) d = '#' + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + (l > 4 ? d[4] + '' + d[4] : '') // 3 or 4 digit
      d = i(d.slice(1), 16), RGB[0] = d >> 16 & 255, RGB[1] = d >> 8 & 255, RGB[2] = d & 255, RGB[3] = -1
      if (l == 9 || l == 5) RGB[3] = r((RGB[2] / 255) * 10000) / 10000, RGB[2] = RGB[1], RGB[1] = RGB[0], RGB[0] = d >> 24 & 255
    }
    return RGB
  }
  var i = parseInt, r = Math.round, h = from.length > 9,
    h = typeof (to) === 'string' ? to.length > 9 ? true : to == 'c' ? !h : false : h, b = p < 0, p = b ? p * -1 : p,
    to = to && to != 'c' ? to : b ? '#000000' : '#FFFFFF', f = pSBCr(from), t = pSBCr(to)
  if (!f || !t) return null // ErrorCheck
  if (h) {
    return 'rgb' + (f[3] > -1 || t[3] > -1 ? 'a(' : '(') + r((t[0] - f[0]) * p + f[0]) + ',' + r((t[1] - f[1]) * p + f[1]) + ',' + r((t[2] - f[2]) * p + f[2]) + (f[3] < 0 && t[3] < 0 ? ')' : ',' + (f[3] > -1 && t[3] > -1 ? r(((t[3] - f[3]) * p + f[3]) * 10000) / 10000 : t[3] < 0 ? f[3] : t[3]) + ')')
  } else {
    return '#' + (0x100000000 + r((t[0] - f[0]) * p + f[0]) * 0x1000000 + r((t[1] - f[1]) * p + f[1]) * 0x10000 + r((t[2] - f[2]) * p + f[2]) * 0x100 + (f[3] > -1 && t[3] > -1 ? r(((t[3] - f[3]) * p + f[3]) * 255) : t[3] > -1 ? r(t[3] * 255) : f[3] > -1 ? r(f[3] * 255) : 255)).toString(16).slice(1, f[3] > -1 || t[3] > -1 ? undefined : -2)
  }
}

export default function (element, canvas) {
  let user
  let cover
  let name

  let camera, scene, renderer, font

  let startPlaytime
  let startPerformanceTime

  let isTitleDisplayed = false
  let titleGroup
  let isLoaded = false
  let lyricTexts = []
  let lyricTextGroups = []
  let currentLyric = null
  let currentGroup = null
  let currentBeat = 0
  let lookingAtLyric = null

  let data = []

  let lrc

  let useLrcSections = false
  const DEFAULT_EASING_TYPE = TWEEN.Easing.Quadratic.InOut
  const DEFAULT_EASING_DURATION = 800
  const LYRIC_GROUP_THRESHOLD = 10
  const CAMERA_INITIAL_Z = 800
  const CAMERA_VERSE_FOV = 60
  const CAMERA_CHORUS_FOV = 95
  const IN_NEGATIVE_THRESHOLD = -0.2

  let darkColor = '#871b42'
  let primaryColor = '#000000'
  let vibrantColor = '#871b42'

  let useCanvas = false
  let canvasTexture
  let ctx

  function getDefaultMaterial () {
    return new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      side: THREE.FrontSide
    })
  }

  function setupScene () {
    camera = new THREE.PerspectiveCamera(CAMERA_VERSE_FOV, element.clientWidth / element.clientHeight, 0.01, 2000)
    camera.position.set(0, 0, CAMERA_INITIAL_Z)
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xffffff)

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(1.5)
    renderer.setSize(element.clientWidth, element.clientHeight)

    element.appendChild(renderer.domElement)
    window.addEventListener('resize', onWindowResize, false)

    if (useCanvas) {
      ctx = canvas.getContext('2d')
      canvasTexture = new THREE.CanvasTexture(canvas)

      const material = new THREE.MeshBasicMaterial({ map: canvasTexture })

      const geometry = new THREE.PlaneGeometry(600, 600)
      const visualPlane = new THREE.Mesh(geometry, material)
      visualPlane.position.set(0, 0, -2000)

      scene.add(visualPlane)
    }

    const loader = new THREE.FontLoader()
    loader.load('/fonts/Neue.json', function (_font) {
      font = _font
      displayTitle()
    })

    animate()
  }

  function displayTitle () {
    if (!isTitleDisplayed) {
      isTitleDisplayed = true

      if (isLoaded) return

      titleGroup = new THREE.Group()

      let message = 'Lyricly.'
      let shapes = font.generateShapes(message, 50)
      let geometry = new THREE.ShapeGeometry(shapes)
      geometry.computeBoundingBox()
      let text = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 1,
        side: THREE.FrontSide
      }))
      text.position.z = 200
      text.position.y = 30
      text.material.depthTest = false

      let xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x)
      geometry.translate(xMid, 0, 0)

      titleGroup.add(text)

      message = user == null ? 'Sign in to get started.' : 'Synchronizing...'
      shapes = font.generateShapes(message, 10)
      geometry = new THREE.ShapeGeometry(shapes)
      geometry.computeBoundingBox()
      text = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 1,
        side: THREE.FrontSide
      }))
      text.position.z = 200
      text.position.y = 0
      text.material.depthTest = false
      xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x)
      geometry.translate(xMid, 0, 0)

      titleGroup.add(text)

      titleGroup.position.y = -20
      titleGroup.rotation.x = -Math.PI / 16

      scene.add(titleGroup)
    }
  }

  this.init = function (_user) {
    user = _user
    setupScene()
  }

  this.load = function (analysis, lyrics, time, _cover, _name) {
    isLoaded = false
    cover = _cover
    name = _name

    if (cover) {
      Vibrant.from(cover).getPalette()
        .then((palette) => {
          darkColor = palette.DarkMuted.getHex()
          primaryColor = palette.DarkVibrant.getHex()
          vibrantColor = palette.Vibrant.getHex()
        })
    }

    if (lyrics != null) {
      const t = window.performance.now()

      if (!time) time = 0
      data = analysis
      lrc = new Lyrics(lyrics)
      const delay = (window.performance.now() - t) / 1000

      startPlaytime = time / 1000 + delay - 0.5
      startPerformanceTime = window.performance.now()
    } else {
      if (scene == null) return
    }

    if (scene != null) {
      new TWEEN.Tween(camera.fov)
        .to(CAMERA_VERSE_FOV, 800)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start()

      const circleGeometry = new THREE.CircleGeometry(300, 64)
      const circle = new THREE.Mesh(circleGeometry, new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0
      }))
      circle.position.set(0, 0, -600)
      circle.rotation.set(
        circle.rotation.x,
        circle.rotation.y,
        circle.rotation.z
      )
      scene.add(circle)

      animateVector3(circle.position, new Vector3(0, 0, CAMERA_INITIAL_Z * 1.5), {
        easing: TWEEN.Easing.Linear.None,
        duration: 1000,
      })
      tween(circle.material, 1, {
        variable: 'opacity',
        easing: TWEEN.Easing.Linear.None,
        duration: 1000,
        callback: function () {
          scene.background = new THREE.Color(0xffffff)
          scene.remove(circle)
        }
      })
    }

    if (scene != null || lyrics == null) {
      console.log('Resetting scene')

      const reset = function () {
        while (scene.children.length > 0) {
          scene.remove(scene.children[0])
        }
        for (const text in lyricTextGroups) {
          scene.remove(text)
        }

        lyricTexts = []
        lyricTextGroups = []
        currentLyric = null
        currentGroup = null
        lookingAtLyric = null
        useLrcSections = false

        useLrcSectionsConfidence = 0
        currentBeat = 0
        lastBeat = -1
        completedTween = true
        isLastChorus = false

        if (lyrics != null) {
          onLoaded()
        } else {
          if (font != null) {
            displayTitle()
          }
        }
      }

      if (titleGroup != null) {
        titleGroup.children.forEach(child => {
          animateVector3(child.position, new Vector3(child.position.x, child.position.y + 350, -1200), {
            easing: TWEEN.Easing.Quadratic.Out,
            duration: 500,
          })
          tween(child.material, 0, {
            variable: 'opacity',
            easing: TWEEN.Easing.Quadratic.Out,
            duration: 500,
            callback: function () {
              reset()
            }
          })
        })
        titleGroup = null
      } else {
        reset()
      }
    }
  }

  function onLoaded () {
    lrc.getLyrics().forEach(it => spawnLyric(it))
    groupLyrics()

    if (font !== null) {
      isLoaded = true
    } else {
      setInterval(function () {
        if (font !== null) {
          isLoaded = true
        }
      }, 100)
    }
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
        const loudness = data.segments[segments].loudness_max
        loudness_sum += loudness
        if (!data.track.loudness_max) data.track.loudness_max = -50
        if (!data.track.loudness_min) data.track.loudness_min = 50

        if (loudness > data.track.loudness_max) data.track.loudness_max = loudness
        if (loudness < data.track.loudness_min) data.track.loudness_min = loudness
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
      group.children.forEach(it => console.log(it.lyric.text))
      buildGroupLayout(group)
    })
  }

  const totalChorusLayout = 1
  const totalVerseLayout = 2
  let currentChorusLayout = 0
  let currentVerseLayout = totalChorusLayout + 1

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

    group.children.forEach(text => {
      const width = text.geometry.boundingBox.max.x - text.geometry.boundingBox.min.x
      if (width > 3500) {
        text.scale.set(text.scale.x * 0.55, text.scale.y * 0.55, text.scale.z)
      } else if (width > 3000) {
        text.scale.set(text.scale.x * 0.6, text.scale.y * 0.5, text.scale.z)
      } else if (width > 2500) {
        text.scale.set(text.scale.x * 0.65, text.scale.y * 0.65, text.scale.z)
      } else if (width > 2000) {
        text.scale.set(text.scale.x * 0.7, text.scale.y * 0.7, text.scale.z)
      } else if (width > 1500) {
        text.scale.set(text.scale.x * 0.8, text.scale.y * 0.8, text.scale.z)
      }
    })

    if (group.layoutType === 0) {
      group.children.forEach(text => {
        text.position.set(text.position.x, text.position.y, -200)
        text.onScreenAnim = 2
        text.material.color = new THREE.Color(0xffffff)
        text.material.needsUpdate = true
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
        if (it.lyric.timestamp - playtime < it.inThreshold && it.lyric.timestamp - playtime > IN_NEGATIVE_THRESHOLD) {
          it.isSpawned = true
          it.visible = true

          currentLyric = it
          if (currentGroup !== it.group) {
            currentGroup = it.group
            onGroup()
          }

          animateIn(it)
        }
      } else if (it.isSpawned && !it.isFadingOut) {
        if (lyricTexts[Math.min(i + 1, lyricTexts.length - 1)].lyric.timestamp - playtime < it.outThreshold ||
          playtime - it.lyric.timestamp > it.onScreenThresHold) {
          animateOut(it)
        }
      }

      // On screen
      if (it.isSpawned && !it.isKilled && !it.isFadingIn && !it.isFadingOut) {
        animateOnScreen(it)
      }
    }

    for (let i = 0; i < lyricTextGroups.length; i++) {
      const group = lyricTextGroups[i]

      if (group.lastChildren.isKilled) continue
      let anySpawn = false
      group.children.forEach(it => {
        if (it.isSpawned) {
          anySpawn = true
        }
      })
      if (!anySpawn) continue

      animateGroup(group)
    }
  }

  let isLastChorus = false

  function onGroup () {
    if (isLastChorus && isChorus()) return
    if (!isLastChorus && !isChorus()) return

    isLastChorus = isChorus()

    const rotateFrom = new THREE.Quaternion().copy(camera.quaternion)

    const lookTo = new THREE.Vector3()

    camera.lookAt(lookTo)

    const rotateTo = new THREE.Quaternion().copy(camera.quaternion)

    camera.quaternion.set(rotateFrom._x, rotateFrom._y, rotateFrom._z, rotateFrom._w)

    new TWEEN.Tween(camera.quaternion)
      .to(rotateTo, 1000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start()

    new TWEEN.Tween(camera.position)
      .to(moveTo, 1000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start()

    new TWEEN.Tween(camera.fov)
      .to(isChorus() ? CAMERA_CHORUS_FOV : CAMERA_VERSE_FOV, 800)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start()

    const circleGeometry = new THREE.CircleGeometry(300, 64)
    const circle = new THREE.Mesh(circleGeometry, new THREE.MeshBasicMaterial({
      color: isChorus() ? darkColor : '#ffffff',
      transparent: true,
      opacity: 0
    }))
    circle.position.set(0, 0, -600)
    circle.rotation.set(
      circle.rotation.x,
      circle.rotation.y,
      circle.rotation.z
    )
    scene.add(circle)

    animateVector3(circle.position, new Vector3(0, 0, CAMERA_INITIAL_Z * 1.5), {
      easing: TWEEN.Easing.Linear.None,
      duration: 1000,
      update: function (d) {
        if (circle.position.z - camera.position.z > -10) {
          scene.background = new THREE.Color(isChorus() ? vibrantColor : '#ffffff')
          scene.remove(circle)
        }
      }
    })
    tween(circle.material, 1, {
      variable: 'opacity',
      easing: TWEEN.Easing.Linear.None,
      duration: 1000
    })
  }

  function onBeat (beat) {
    currentBeat = beat.index % data.track.time_signature

    spawnPulse()

    if (isChorus(currentGroup) && currentBeat === 0) {
      const rgb = hexToRgb(vibrantColor)
      const color = rgbToHex(rgb.r, rgb.g, rgb.b)
      const darken = pSBC(-0.4, color)

      new TWEEN.Tween(new THREE.Color(color))
        .to(new THREE.Color(darken), 200)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(function (color) {
          scene.background = color
        })
        .onComplete(() => {
          new TWEEN.Tween(new THREE.Color(darken))
            .to(new THREE.Color(color), 600)
            .easing(TWEEN.Easing.Quadratic.In)
            .onUpdate(function (color) {
              scene.background = color
            })
            .start()
        })
        .start()
    }
  }

  function animateIn (text) {
    text.isFadingIn = true
    let toPos = new Vector3(text.position.x, text.position.y, text.position.z)
    let toRot = new Vector3(text.rotation.x, text.rotation.y, text.rotation.z)

    // Store original location
    text.originalPosition = new Vector3()
    text.getWorldPosition(text.originalPosition)

    if (text.inOutAnim === 0) {
      toRot = new Vector3(text.rotation.x + Math.PI / 16, text.rotation.y, text.rotation.z)
      text.position.set(text.position.x, text.position.y - 25, text.position.z)
      text.rotation.set(text.rotation.x - Math.PI / 6, text.rotation.y, text.rotation.z)
    } else if (text.inOutAnim === 1) {
      text.position.set(text.position.x - 100, text.position.y, text.position.z)
    }
    animateVector3(text.position, toPos, {
      easing: DEFAULT_EASING_TYPE,
      duration: DEFAULT_EASING_DURATION,
    })
    animateVector3(text.rotation, toRot, {
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
    let toPos
    let toRot
    if (text.inOutAnim === 0) {
      toPos = new Vector3(text.position.x, text.position.y + 25, text.position.z)
      toRot = new Vector3(text.rotation.x - Math.PI / 6 - Math.PI / 16, text.rotation.y, text.rotation.z)
    } else if (text.inOutAnim === 1) {
      toPos = new Vector3(text.position.x + 100, text.position.y, text.position.z)
      toRot = new Vector3(text.rotation.x, text.rotation.y, text.rotation.z)
    }
    animateVector3(text.position, toPos, {
      easing: DEFAULT_EASING_TYPE,
      duration: DEFAULT_EASING_DURATION,
    })
    animateVector3(text.rotation, toRot, {
      easing: DEFAULT_EASING_TYPE,
      duration: DEFAULT_EASING_DURATION,
    })

    tween(text.material, 0, {
      variable: 'opacity',
      easing: DEFAULT_EASING_TYPE,
      duration: DEFAULT_EASING_DURATION,
      update: function () {
        if (!text.isKilled && text.position.distanceTo(toPos) < 2) {
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
    } else if (text.onScreenAnim === 2) {
      text.scale.set(text.scale.x + 0.001, text.scale.y + 0.001, text.scale.z)
      text.rotation.set(text.rotation.x, text.rotation.y + 0.001, text.rotation.z)
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
    const tempoMultiplier = 100.0 / data.track.tempo * 3
    const groupMultiplier = currentGroup != null ? ((currentGroup.avg_loudness - data.track.loudness_min) / (data.track.loudness_max - data.track.loudness_min)) : 1

    const material = new THREE.MeshBasicMaterial({
      color: (currentBeat === 0 && isChorus(currentGroup)) ? darkColor : primaryColor,
      transparent: true,
      opacity: 0,
    })

    const radius = ((isChorus() || currentBeat === 0) ? 400 : 200) * groupMultiplier
    const segments = 64

    const circleGeometry = new THREE.CircleGeometry(radius, segments)
    const circle = new THREE.Mesh(circleGeometry, material)
    circle.position.set(
      isChorus() ? 0 : (currentBeat === 0 ? getRandomDouble(-900, 900) : getRandomDouble(-700, 700)),
      isChorus() ? -80 : (currentBeat === 0 ? getRandomDouble(-600, 600) : getRandomDouble(-500, 500)),
      isChorus() ? -300 : getRandomDouble(-600, -300)
    )
    circle.rotation.set(
      circle.rotation.x,
      circle.rotation.y,
      circle.rotation.z
    )
    scene.add(circle)

    animateVector3(circle.position, new Vector3(
      isChorus() ? 0 : circle.position.x + (currentBeat === 0 ? getRandomDouble(-450, 450) : getRandomDouble(-400, 400)),
      isChorus() ? 0 : circle.position.y + (currentBeat === 0 ? getRandomDouble(-300, 300) : getRandomDouble(-250, 250)),
      circle.position.z + isChorus() ? 1000 : getRandomDouble(300, 600), {
        easing: TWEEN.Easing.Linear.None,
        duration: isChorus() ? 1000 : 2000 * tempoMultiplier,
      }))

    tween(circle.material, 0.2, {
      variable: 'opacity',
      easing: TWEEN.Easing.Linear.None,
      duration: (isChorus() ? 200 : 400) * tempoMultiplier,
      callback: function () {
        tween(circle.material, 0, {
          variable: 'opacity',
          easing: TWEEN.Easing.Linear.None,
          duration: (isChorus() ? 800 : 1600) * tempoMultiplier,
          callback: function () {
            scene.remove(circle)
          }
        })
      }
    })
  }

  let lastBeat = -1

  function checkBeat () {
    while (lastBeat + 1 < data.beats.length && playtime >= data.beats[lastBeat + 1].start) {
      lastBeat++
      data.beats[lastBeat].processed = true

      if (playtime - data.beats[lastBeat].start < 1) {
        data.beats[lastBeat].index = lastBeat
        onBeat(data.beats[lastBeat])
      }
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

    if (isLoaded) {
      playtime = startPlaytime + (window.performance.now() - startPerformanceTime) / 1000.0
      checkBeat()
    }
    render()
  }

  let completedTween = true

  function render () {
    renderer.render(scene, camera)
    if (isLoaded) {
      renderLyricTexts()

      if (currentLyric != null && lookingAtLyric !== currentLyric) {
        lookingAtLyric = currentLyric
        const moveFrom = new THREE.Vector3().copy(camera.position)
        const moveTo = new THREE.Vector3(0, 0, CAMERA_INITIAL_Z)
        moveTo.x += getRandomDouble(-300, 300)
        moveTo.y += getRandomDouble(0, -120)
        moveTo.z += getRandomDouble(0, 160)

        const rotateFrom = new THREE.Quaternion().copy(camera.quaternion)

        const lookTo = new THREE.Vector3().copy(lookingAtLyric.originalPosition)

        camera.position.set(moveTo.x, moveTo.y, moveTo.z)
        camera.lookAt(lookTo)

        const rotateTo = new THREE.Quaternion().copy(camera.quaternion)

        camera.quaternion.set(rotateFrom._x, rotateFrom._y, rotateFrom._z, rotateFrom._w)
        camera.position.set(moveFrom.x, moveFrom.y, moveFrom.z)

        completedTween = false

        new TWEEN.Tween(camera.quaternion)
          .to(rotateTo, 1000)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .onComplete(() => {
            completedTween = true
          })
          .start()

        new TWEEN.Tween(camera.position)
          .to(moveTo, 1000)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .start()
      } else if (completedTween && lookingAtLyric != null) {

      }

      if (useCanvas) {
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        canvasTexture.needsUpdate = true
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

  function getRandomDouble (min, max) {
    return Math.random() * (max - min) + min
  }

  function hexToRgb (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  function componentToHex (c) {
    var hex = c.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  function rgbToHex (r, g, b) {
    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b)
  }
}
