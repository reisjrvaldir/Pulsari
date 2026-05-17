import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function GlobeScene() {
  const mountRef = useRef(null)

  useEffect(() => {
    const W = window.innerWidth, H = window.innerHeight

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(W, H)
    mountRef.current.appendChild(renderer.domElement)

    /* ── Scene / Camera ── */
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100)
    /* câmera fixa — o GRUPO do globo se desloca */
    camera.position.set(0, 0, 5.5)
    camera.lookAt(0, 0, 0)

    /* ── Grupo que contém todo o globo ── */
    const globeGroup = new THREE.Group()
    scene.add(globeGroup)

    /* offset inicial: globo começa fora da tela à direita */
    const startX = 4.5   /* unidades mundo → direita */
    globeGroup.position.x = startX

    /* ── Esfera principal wireframe ── */
    const sphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.6, 6),
      new THREE.MeshPhongMaterial({
        color: 0x5A2EA6, emissive: 0x1E0B2E,
        wireframe: true, transparent: true, opacity: 0.55,
      })
    )
    globeGroup.add(sphere)

    /* ── Esfera interna glow ── */
    const inner = new THREE.Mesh(
      new THREE.SphereGeometry(1.55, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xFF2D8D, transparent: true, opacity: 0.05, side: THREE.BackSide })
    )
    globeGroup.add(inner)

    /* ── Partículas ── */
    const pCount = 3000
    const pos = new Float32Array(pCount * 3)
    for (let i = 0; i < pCount; i++) {
      const r     = 2.5 + Math.random() * 4
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const particles = new THREE.Points(pGeo,
      new THREE.PointsMaterial({ color: 0xb06aff, size: 0.025, transparent: true, opacity: 0.9 })
    )
    globeGroup.add(particles)

    /* ── Anéis orbitais ── */
    const mkRing = (r, tube, color, opacity, rx = 0, ry = 0, rz = 0) => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(r, tube, 8, 120),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
      )
      m.rotation.set(rx, ry, rz)
      globeGroup.add(m)
      return m
    }
    const ring1 = mkRing(2.1, 0.006, 0x5A2EA6, 0.60, Math.PI / 4)
    const ring2 = mkRing(2.5, 0.005, 0xFF2D8D, 0.45, -Math.PI / 3, Math.PI / 6)
    const ring3 = mkRing(1.8, 0.005, 0x2D6BFF, 0.50, 0, 0, Math.PI / 5)

    /* ── Luzes (na scene, não no grupo) ── */
    scene.add(new THREE.AmbientLight(0x1E0B2E, 2))
    const pl1 = new THREE.PointLight(0xFF2D8D, 8, 12)
    const pl2 = new THREE.PointLight(0x2D6BFF, 5, 10)
    const pl3 = new THREE.PointLight(0x5A2EA6, 4, 8)
    pl3.position.set(0, 4, -2)
    scene.add(pl1, pl2, pl3)

    /* ── Mouse parallax ── */
    let mx = 0, my = 0
    const onMouse = e => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2
      my = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouse)

    /* ── Ease ── */
    const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    const lerp  = THREE.MathUtils.lerp

    /* ── Loop ── */
    let animId
    const animate = time => {
      animId = requestAnimationFrame(animate)
      const t = time * 0.001
      const rawP = Math.min(1, Math.max(0, window.scrollY / window.innerHeight))
      const ep   = ease(rawP)

      /* Grupo desloca X: começa à direita, centraliza ao scrollar */
      const targetGX = lerp(startX, 0, ep)
      globeGroup.position.x = lerp(globeGroup.position.x, targetGX + mx * 0.15 * (1 - ep), 0.06)
      globeGroup.position.y = lerp(globeGroup.position.y, -my * 0.1 * (1 - ep), 0.06)

      /* Câmera se aproxima: longe no hero, perto no sobre */
      camera.position.z = lerp(camera.position.z, lerp(5.5, 3.5, ep), 0.06)

      /* opacidade esfera */
      sphere.material.opacity = lerp(0.45, 0.70, ep)

      /* luzes orbitam ao redor do globo */
      pl1.position.set(
        globeGroup.position.x + Math.sin(t * 0.7) * 4,
        Math.cos(t * 0.5) * 3,
        Math.cos(t * 0.7) * 4
      )
      pl2.position.set(
        globeGroup.position.x + Math.cos(t * 0.6) * 3,
        Math.sin(t * 0.4) * 4,
        Math.sin(t * 0.6) * 3
      )

      /* respiração esfera */
      const s = 1 + Math.sin(t * 0.8) * 0.04
      sphere.scale.setScalar(s)
      inner.scale.setScalar(s)

      /* rotações */
      sphere.rotation.y   += 0.0015
      sphere.rotation.x   += 0.0005
      particles.rotation.y += 0.0003
      ring1.rotation.z    += 0.004
      ring2.rotation.x    += 0.003
      ring3.rotation.y    += 0.002

      renderer.render(scene, camera)
    }
    animId = requestAnimationFrame(animate)

    /* ── Resize ── */
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mountRef.current?.contains(renderer.domElement))
        mountRef.current.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div ref={mountRef} style={{
      position: 'fixed', inset: 0,
      width: '100%', height: '100%',
      zIndex: 0, pointerEvents: 'none',
    }} />
  )
}
