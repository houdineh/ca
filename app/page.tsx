'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// Types
interface LanyardData {
  discord_user: {
    id: string
    username: string
    avatar: string
    discriminator: string
    global_name: string
  }
  discord_status: 'online' | 'idle' | 'dnd' | 'offline'
  activities: Array<{
    name: string
    type: number
    state?: string
    details?: string
    application_id?: string
    assets?: {
      large_image?: string
      large_text?: string
      small_image?: string
      small_text?: string
    }
  }>
  listening_to_spotify: boolean
  spotify?: {
    track_id: string
    song: string
    artist: string
    album: string
    album_art_url: string
    timestamps: {
      start: number
      end: number
    }
  }
}

// Custom hook for Lanyard WebSocket
function useLanyard(userId: string) {
  const [data, setData] = useState<LanyardData | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket('wss://api.lanyard.rest/socket')
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({
          op: 2,
          d: { subscribe_to_id: userId }
        }))
      }

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if (message.op === 0 && message.t === 'INIT_STATE') {
          setData(message.d)
        } else if (message.op === 0 && message.t === 'PRESENCE_UPDATE') {
          setData(message.d)
        } else if (message.op === 1) {
          // Heartbeat
          setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ op: 3 }))
            }
          }, message.d.heartbeat_interval)
        }
      }

      ws.onclose = () => {
        setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      wsRef.current?.close()
    }
  }, [userId])

  return data
}

export default function Portfolio() {
  const [loaded, setLoaded] = useState(false)
  const [introComplete, setIntroComplete] = useState(false)
  const [tint, setTint] = useState<'default' | 'blue' | 'green' | 'rose' | 'amber'>('default')
  const [toast, setToast] = useState<string | null>(null)
  const [terminalLines, setTerminalLines] = useState<string[]>([])
  const [staticMode, setStaticMode] = useState(false)
  const [konamiIndex, setKonamiIndex] = useState(0)
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string }>>([])
  
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorRingRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  const lanyard = useLanyard('1338171592882262088')

  // Tint colors
  const tintColors: Record<string, string> = {
    default: '#ffffff',
    blue: '#3b82f6',
    green: '#22c55e',
    rose: '#f43f5e',
    amber: '#f59e0b'
  }

  // Intro animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true)
    }, 100)

    const introTimer = setTimeout(() => {
      setIntroComplete(true)
    }, 2500)

    return () => {
      clearTimeout(timer)
      clearTimeout(introTimer)
    }
  }, [])

  // Custom cursor
  useEffect(() => {
    if (!introComplete) return

    const cursor = cursorRef.current
    const ring = cursorRingRef.current
    if (!cursor || !ring) return

    let mouseX = 0
    let mouseY = 0
    let ringX = 0
    let ringY = 0

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      cursor.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`
    }

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.12
      ringY += (mouseY - ringY) * 0.12
      ring.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px)`
      requestAnimationFrame(animateRing)
    }

    window.addEventListener('mousemove', handleMouseMove)
    animateRing()

    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [introComplete])

  // Stats animation
  useEffect(() => {
    if (!introComplete || !statsRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const counters = entry.target.querySelectorAll('[data-count]')
            counters.forEach((counter) => {
              const target = parseInt(counter.getAttribute('data-count') || '0', 10)
              let current = 0
              const increment = target / 60
              const animate = () => {
                current += increment
                if (current < target) {
                  counter.textContent = Math.floor(current).toString()
                  requestAnimationFrame(animate)
                } else {
                  counter.textContent = target.toString()
                }
              }
              animate()
            })
            observer.disconnect()
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [introComplete])

  // Terminal typewriter
  useEffect(() => {
    if (!introComplete || !terminalRef.current) return

    const lines = [
      '$ whoami',
      'chrome',
      '$ cat about.txt',
      'Full-stack developer with 3 years of experience.',
      'Passionate about game development and 3D art.',
      'Building pixel-perfect experiences.',
      '$ ls skills/',
      'react/ nextjs/ unity/ blender/ fmod/ postgres/',
      '$ echo $STATUS',
      'Available for work'
    ]

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            let lineIndex = 0
            const addLine = () => {
              if (lineIndex < lines.length) {
                const currentLine = lines[lineIndex]
                setTerminalLines((prev) => [...prev, currentLine])
                lineIndex++
                const nextDelay = currentLine.startsWith('$') ? 400 : 200
                if (lineIndex < lines.length) {
                  setTimeout(addLine, nextDelay)
                }
              }
            }
            addLine()
            observer.disconnect()
          }
        })
      },
      { threshold: 0.3 }
    )

    observer.observe(terminalRef.current)
    return () => observer.disconnect()
  }, [introComplete])

  // Keyboard shortcuts
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Konami code
    if (e.code === konamiCode[konamiIndex]) {
      const newIndex = konamiIndex + 1
      setKonamiIndex(newIndex)
      if (newIndex === konamiCode.length) {
        // Trigger confetti
        const newConfetti = Array.from({ length: 80 }, (_, i) => ({
          id: Date.now() + i,
          x: Math.random() * window.innerWidth,
          y: -20,
          color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'][Math.floor(Math.random() * 6)]
        }))
        setConfetti(newConfetti)
        setTimeout(() => setConfetti([]), 3000)
        setKonamiIndex(0)
        showToast('🎉 Konami Code Activated!')
      }
    } else {
      setKonamiIndex(0)
    }

    // Other shortcuts
    switch (e.code) {
      case 'KeyG':
        window.open('https://github.com', '_blank')
        break
      case 'KeyD':
        window.open('https://discord.com', '_blank')
        break
      case 'KeyX':
        window.open('https://x.com', '_blank')
        break
      case 'KeyT':
        cycleTint()
        break
      case 'KeyS':
        setStaticMode((prev) => !prev)
        break
    }
  }, [konamiIndex])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const cycleTint = () => {
    const tints: Array<'default' | 'blue' | 'green' | 'rose' | 'amber'> = ['default', 'blue', 'green', 'rose', 'amber']
    const currentIndex = tints.indexOf(tint)
    const nextTint = tints[(currentIndex + 1) % tints.length]
    setTint(nextTint)
    showToast(`Tint: ${nextTint}`)
  }

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  const copyEmail = () => {
    navigator.clipboard.writeText('contact@chromes.online')
    showToast('Email copied!')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#22c55e'
      case 'idle': return '#eab308'
      case 'dnd': return '#ef4444'
      default: return '#6b7280'
    }
  }

  // Intro screen
  if (!introComplete) {
    return (
      <div className="fixed inset-0 bg-[#0D0D0D] flex items-center justify-center z-50">
        <div className="text-center">
          <h1 
            className={`text-6xl font-bold text-white transition-all duration-1000 ${
              loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ 
              fontFamily: 'Syne, sans-serif',
              clipPath: loaded ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
              transition: 'clip-path 0.8s cubic-bezier(0.77, 0, 0.175, 1), opacity 0.5s, transform 0.5s'
            }}
          >
            chrome
          </h1>
          <div 
            className={`h-1 bg-white mt-4 mx-auto transition-all duration-1000 delay-500 ${
              loaded ? 'w-32' : 'w-0'
            }`}
          />
          <p 
            className={`text-neutral-500 mt-4 font-mono text-sm transition-all duration-500 delay-1000 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Loading experience...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen bg-[#0D0D0D] text-white overflow-x-hidden"
      style={{ 
        '--tint': tintColors[tint],
        cursor: 'none'
      } as React.CSSProperties}
    >
      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-50">
        <svg className="w-full h-full">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </div>

      {/* TV Static overlay */}
      {staticMode && (
        <div className="fixed inset-0 pointer-events-none z-40 animate-pulse opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSBiYXNlRnJlcXVlbmN5PSIwLjkiIG51bU9jdGF2ZXM9IjEwIiAvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjEiLz48L3N2Zz4=')]" />
      )}

      {/* Pixel Grid Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <svg className="w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pixelGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="38" height="38" fill={tintColors[tint]} className="transition-colors duration-700" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pixelGrid)" />
        </svg>
        {/* Subtle glow orbs */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07] transition-colors duration-700"
          style={{
            background: `radial-gradient(circle, ${tintColors[tint]}, transparent 70%)`,
            filter: 'blur(100px)',
            top: '-10%',
            left: '-10%'
          }}
        />
        <div 
          className="absolute w-[500px] h-[500px] rounded-full opacity-[0.05] transition-colors duration-700"
          style={{
            background: `radial-gradient(circle, ${tintColors[tint]}, transparent 70%)`,
            filter: 'blur(120px)',
            bottom: '10%',
            right: '-5%'
          }}
        />
      </div>

      {/* Custom cursor */}
      <div 
        ref={cursorRef}
        className="fixed w-2 h-2 bg-white rounded-full pointer-events-none z-[100] mix-blend-difference"
      />
      <div 
        ref={cursorRingRef}
        className="fixed w-10 h-10 border border-white/50 rounded-full pointer-events-none z-[100] mix-blend-difference"
      />

      {/* Scroll progress */}
      <div 
        className="fixed top-0 left-0 h-0.5 z-50"
        style={{ 
          background: `linear-gradient(90deg, ${tintColors[tint]}, transparent)`,
          width: '0%',
          boxShadow: `0 0 10px ${tintColors[tint]}`
        }}
        id="scroll-progress"
      />

      {/* Toast */}
      {toast && (
        <div 
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full z-50 animate-bounce-in"
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <span className="text-sm font-mono">{toast}</span>
        </div>
      )}

      {/* Confetti */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="fixed w-3 h-3 rounded-full pointer-events-none z-[60] animate-confetti"
          style={{
            left: particle.x,
            top: particle.y,
            backgroundColor: particle.color,
          }}
        />
      ))}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-8 py-6 flex items-center justify-between">
        <div 
          className="text-2xl font-bold"
          style={{ fontFamily: 'Syne, sans-serif', color: tintColors[tint] }}
        >
          chrome
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={cycleTint}
            className="px-4 py-2 text-sm font-mono rounded-full transition-all hover:scale-105"
            style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            tint: {tint}
          </button>
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full animate-pulse relative"
              style={{ backgroundColor: '#22c55e' }}
            >
              <div 
                className="absolute inset-0 rounded-full animate-ping"
                style={{ backgroundColor: '#22c55e', opacity: 0.4 }}
              />
            </div>
            <span className="text-sm text-neutral-400">available for work</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 pt-32 px-8 max-w-6xl mx-auto">
        {/* Hero */}
        <section className="min-h-[60vh] flex flex-col justify-center mb-20">
          <p 
            className="text-sm font-mono mb-4 tracking-widest uppercase"
            style={{ color: tintColors[tint] }}
          >
            Creative Developer
          </p>
          <h1 
            className="text-7xl md:text-9xl font-bold mb-6 leading-none transition-colors duration-500"
            style={{ 
              fontFamily: 'Syne, sans-serif',
              color: tintColors[tint]
            }}
          >
            Pixel<br />Perfect.
          </h1>
          <p className="text-lg text-neutral-400 max-w-xl font-mono leading-relaxed">
            Full-stack developer crafting immersive digital experiences. 
            From games to web apps, I build things that matter.
          </p>
        </section>

        {/* Status Widget */}
        <section className="mb-20">
          {/* Discord Widget */}
          <div 
            className="p-6 rounded-2xl relative overflow-hidden group max-w-md"
            style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${tintColors[tint]}10, transparent 70%)`
              }}
            />
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                {lanyard?.discord_user?.avatar ? (
                  <img 
                    src={`https://cdn.discordapp.com/avatars/${lanyard.discord_user.id}/${lanyard.discord_user.avatar}.png?size=64`}
                    alt="Discord Avatar"
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </div>
                )}
                <div 
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0D0D0D]"
                  style={{ backgroundColor: getStatusColor(lanyard?.discord_status || 'offline') }}
                >
                  <div 
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ 
                      backgroundColor: getStatusColor(lanyard?.discord_status || 'offline'),
                      opacity: 0.4 
                    }}
                  />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
                  chrome!
                </h3>
                <p className="text-neutral-400 text-sm capitalize">
                  {lanyard?.discord_status || 'Offline'}
                </p>
              </div>
            </div>

            {/* Activity */}
            {lanyard?.activities && lanyard.activities.length > 0 && !lanyard.listening_to_spotify && (
              <div className="mt-4 p-3 rounded-xl bg-white/5">
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Playing</p>
                <p className="text-sm font-medium">{lanyard.activities[0]?.name}</p>
                {lanyard.activities[0]?.details && (
                  <p className="text-xs text-neutral-400 mt-1">{lanyard.activities[0].details}</p>
                )}
              </div>
            )}

            {/* Spotify */}
            {lanyard?.listening_to_spotify && lanyard.spotify && (
              <div className="mt-4 p-3 rounded-xl bg-[#1DB954]/10 border border-[#1DB954]/20">
                <div className="flex items-center gap-3">
                  <img 
                    src={lanyard.spotify.album_art_url} 
                    alt="Album art"
                    className="w-12 h-12 rounded-lg"
                  />
                  <div className="overflow-hidden flex-1">
                    <p className="text-xs text-[#1DB954] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      Listening
                    </p>
                    <p className="text-sm font-medium truncate animate-marquee">
                      {lanyard.spotify.song}
                    </p>
                    <p className="text-xs text-neutral-400 truncate">
                      {lanyard.spotify.artist}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Stats */}
        <section 
          ref={statsRef}
          className="mb-20 p-6 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 3, label: 'Yrs coding' },
              { value: 1, label: 'Game shipped' },
              { value: 44, label: 'Caches found' },
              { value: 15, label: 'Stacks mastered' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div 
                  className="text-4xl md:text-5xl font-bold mb-2"
                  style={{ fontFamily: 'Syne, sans-serif', color: tintColors[tint] }}
                  data-count={stat.value}
                >
                  0
                </div>
                <div className="text-sm text-neutral-500 font-mono">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className="mb-20">
          <h2 
            className="text-3xl font-bold mb-8"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Skills
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Full Stack Dev',
                description: 'Building end-to-end web applications with modern frameworks',
                tags: ['React', 'Next.js', 'Node.js', 'PostgreSQL'],
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                )
              },
              {
                title: 'Video Game Dev',
                description: 'Creating immersive gaming experiences with Unity and Unreal',
                tags: ['Unity', 'C#', 'Unreal', 'Godot'],
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                title: '3D Modeling',
                description: 'Crafting detailed 3D assets and environments',
                tags: ['Blender', 'Maya', 'Substance', 'ZBrush'],
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                  </svg>
                )
              },
              {
                title: 'Sound Engineering',
                description: 'Designing audio landscapes and soundtracks',
                tags: ['FMOD', 'Wwise', 'Ableton', 'Pro Tools'],
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                )
              },
              {
                title: 'Heavy Gamer',
                description: 'Competitive player across multiple genres',
                tags: ['FPS', 'RPG', 'Strategy', 'Indie'],
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                )
              },
              {
                title: 'Avid Geocacher',
                description: 'Exploring the world one cache at a time',
                tags: ['EarthCache', 'Multi', 'Puzzle', 'Virtual'],
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )
              }
            ].map((skill, i) => (
              <div 
                key={i}
                className="p-6 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  animationDelay: `${i * 100}ms`
                }}
              >
                {/* Shimmer effect */}
                <div 
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
                  }}
                />
                {/* Hover glow */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${tintColors[tint]}10, transparent 70%)`
                  }}
                />
                <div className="relative z-10">
                  <div 
                    className="mb-4"
                    style={{ color: tintColors[tint] }}
                  >
                    {skill.icon}
                  </div>
                  <h3 
                    className="text-xl font-bold mb-2"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    {skill.title}
                  </h3>
                  <p className="text-neutral-400 text-sm mb-4">{skill.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {skill.tags.map((tag, j) => (
                      <span 
                        key={j}
                        className="px-3 py-1 text-xs font-mono rounded-full"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Terminal */}
        <section className="mb-20">
          <h2 
            className="text-3xl font-bold mb-8"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            About
          </h2>
          <div 
            ref={terminalRef}
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {/* macOS chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="text-xs text-neutral-500 ml-2 font-mono">chrome@portfolio ~ %</span>
            </div>
            <div className="p-6 font-mono text-sm min-h-[300px]">
              {terminalLines.map((line, i) => (
                <div 
                  key={i}
                  className={`mb-1 ${line.startsWith('$') ? 'text-green-400' : 'text-neutral-300'}`}
                  style={{ animation: 'fadeIn 0.3s ease forwards' }}
                >
                  {line}
                </div>
              ))}
              <span className="animate-blink">▊</span>
            </div>
          </div>
        </section>

        {/* Geocaching Widget */}
        <section className="mb-20">
          <h2 
            className="text-3xl font-bold mb-8"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Adventures
          </h2>
          <div 
            className="p-6 rounded-2xl grid md:grid-cols-2 gap-6"
            style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            {/* Radar */}
            <div className="relative aspect-square max-w-xs mx-auto">
              <div className="absolute inset-0 rounded-full border border-white/10" />
              <div className="absolute inset-[15%] rounded-full border border-white/10" />
              <div className="absolute inset-[30%] rounded-full border border-white/10" />
              <div className="absolute inset-[45%] rounded-full border border-white/10" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10" />
              {/* Sweep */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from 0deg, transparent 0deg, ${tintColors[tint]}40 30deg, transparent 60deg)`,
                  animation: 'radar 4s linear infinite'
                }}
              />
              {/* GPS dots */}
              {[
                { top: '25%', left: '40%' },
                { top: '60%', left: '70%' },
                { top: '35%', left: '65%' },
                { top: '70%', left: '30%' }
              ].map((pos, i) => (
                <div 
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    ...pos,
                    backgroundColor: tintColors[tint],
                    animation: `pulse 2s ease-in-out infinite ${i * 0.5}s`
                  }}
                />
              ))}
            </div>
            {/* Info */}
            <div className="flex flex-col justify-center">
              <div 
                className="text-6xl font-bold mb-2"
                style={{ fontFamily: 'Syne, sans-serif', color: tintColors[tint] }}
              >
                44
              </div>
              <p className="text-neutral-400 mb-6">Total Geocaches Found</p>
              <div className="flex flex-wrap gap-2">
                {['Traditional', 'Multi-cache', 'EarthCache', 'Virtual', 'Puzzle'].map((type, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1 text-xs font-mono rounded-full"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Connect */}
        <section className="mb-12">
          <h2 
            className="text-3xl font-bold mb-8"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Connect
          </h2>
          <div className="flex flex-wrap gap-4">
            {[
              { name: 'Discord', href: 'https://discord.com' },
              { name: 'GitHub', href: 'https://github.com' },
              { name: 'X / Twitter', href: 'https://x.com' }
            ].map((link, i) => (
              <a 
                key={i}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 rounded-full font-mono text-sm transition-all hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                {link.name}
              </a>
            ))}
            <button 
              onClick={copyEmail}
              className="px-6 py-3 rounded-full font-mono text-sm transition-all hover:scale-105"
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              Copy Email
            </button>
          </div>
        </section>

        {/* Keyboard shortcuts */}
        <section className="mb-20 flex flex-wrap items-center gap-4 text-neutral-500 text-sm font-mono">
          <span>Shortcuts:</span>
          {['G', 'D', 'X', 'T', 'S'].map((key, i) => (
            <kbd 
              key={i}
              className="px-2 py-1 rounded text-xs"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              {key}
            </kbd>
          ))}
          <span className="text-neutral-600">Try the Konami code 🎮</span>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div 
            className="text-xl font-bold"
            style={{ fontFamily: 'Syne, sans-serif', color: tintColors[tint] }}
          >
            chrome
          </div>
          <p className="text-neutral-500 text-sm">
            Lohitaksh Karnatakapu — © {new Date().getFullYear()} all rights reserved
          </p>
        </footer>
      </main>

      {/* Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;500;600;700;800&display=swap');

        * {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes radar {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes bounce-in {
          0% { transform: translateX(-50%) translateY(20px); opacity: 0; }
          100% { transform: translateX(-50%) translateY(0); opacity: 1; }
        }

        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }

        .animate-blink {
          animation: blink 1s step-end infinite;
        }

        .animate-bounce-in {
          animation: bounce-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .animate-confetti {
          animation: confetti 3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .animate-marquee {
          animation: marquee 10s linear infinite;
        }

        body {
          font-family: 'DM Mono', monospace;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Prevent layout shifts */
        img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  )
}
