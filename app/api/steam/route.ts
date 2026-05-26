import { NextResponse } from 'next/server'

const STEAM_API_KEY = process.env.STEAM_API_KEY || 'B018C6CBB0A3EAF078477D2FB33B246E'
const STEAM_ID = '76561199825377498' // Your SteamID64

export async function GET() {
  try {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${STEAM_ID}`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 30 } // Cache for 30 seconds
    })

    if (!response.ok) {
      throw new Error(`Steam API error: ${response.status}`)
    }

    const data = await response.json()
    const player = data.response?.players?.[0]

    if (!player) {
      return NextResponse.json({ 
        status: 'offline',
        personaname: 'chrome',
        gameid: null,
        gameextrainfo: null
      })
    }

    // personastate: 0 = Offline, 1 = Online, 2 = Busy, 3 = Away, 4 = Snooze, 5 = Looking to trade, 6 = Looking to play
    const statusMap: Record<number, string> = {
      0: 'offline',
      1: 'online',
      2: 'busy',
      3: 'away',
      4: 'snooze',
      5: 'online',
      6: 'online'
    }

    return NextResponse.json({
      status: statusMap[player.personastate] || 'offline',
      personaname: player.personaname,
      avatar: player.avatarfull,
      gameid: player.gameid || null,
      gameextrainfo: player.gameextrainfo || null,
      gameImage: player.gameid 
        ? `https://steamcdn-a.akamaihd.net/steam/apps/${player.gameid}/header.jpg`
        : null
    })
  } catch (error) {
    console.error('Steam API error:', error)
    return NextResponse.json({ 
      status: 'offline',
      personaname: 'chrome',
      gameid: null,
      gameextrainfo: null,
      error: 'Failed to fetch Steam data'
    }, { status: 500 })
  }
}
