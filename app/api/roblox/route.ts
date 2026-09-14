import { NextRequest, NextResponse } from 'next/server'

const GAMES = 'https://games.roblox.com'
const USERS = 'https://users.roblox.com'
const THUMBS = 'https://thumbnails.roblox.com'
const ANALYTICS = 'https://apis.roblox.com/analytics-query-api/v1'

async function get(url: string, init?: RequestInit) {
  const r = await fetch(url, { ...init, headers: { accept: 'application/json', ...(init?.headers || {}) }, cache: 'no-store' })
  if (!r.ok) throw new Error(`${r.status} API`)
  return r.json()
}

function placeFromUrl(input: string) { return input.match(/roblox\.com\/games\/(\d+)/i)?.[1] || null }

async function resolve(q: string) {
  const placeId = placeFromUrl(q)
  if (placeId) {
    const p = await get(`${GAMES}/v1/games/multiget-place-details?placeIds=${placeId}`)
    const d = p.data?.[0] || p[0]
    if (!d?.universeId) return null
    return (await get(`${GAMES}/v1/games?universeIds=${d.universeId}`)).data?.[0]
  }
  if (/^\d+$/.test(q)) return (await get(`${GAMES}/v1/games?universeIds=${q}`)).data?.[0]
  const s = await get(`${GAMES}/v1/games/list?keyword=${encodeURIComponent(q)}&maxRows=20`)
  return s.games?.[0] || s.data?.[0]
}

function metricResult(body: any) { return body?.response?.values?.[0]?.dataPoints || body?.values?.[0]?.dataPoints || [] }

async function creatorAnalytics(universeId: string, created: string) {
  const key = process.env.ROBLOX_API_KEY
  if (!key) return { enabled: false, reason: 'ROBLOX_API_KEY absent' }
  const end = new Date(); const start = new Date(created || Date.now())
  const days = Math.min(Math.max(Math.ceil((end.getTime() - start.getTime()) / 86400000), 1), 3650)
  start.setTime(end.getTime() - days * 86400000)
  const out: Record<string, any[]> = {}
  for (const metric of ['DailyActiveUsers', 'DailyRevenue', 'ForwardD1Retention']) {
    try {
      const body = await get(`${ANALYTICS}/universes/${universeId}/metrics`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key }, body: JSON.stringify({ metric, granularity: 'OneDay', startTime: start.toISOString(), endTime: end.toISOString() }) })
      out[metric] = metricResult(body)
    } catch { out[metric] = [] }
  }
  return { enabled: true, startTime: start.toISOString(), endTime: end.toISOString(), metrics: out }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ error: 'Recherche vide' }, { status: 400 })
  try {
    const universe = await resolve(q)
    if (!universe?.id) return NextResponse.json({ error: 'Jeu introuvable' }, { status: 404 })
    const uid = String(universe.id), creatorId = universe.creator?.id
    const [votes, favs, media, creator, place, thumb, privateAnalytics] = await Promise.all([
      get(`${GAMES}/v1/games/votes?universeIds=${uid}`).catch(() => ({})),
      get(`${GAMES}/v1/games/${uid}/favorites/count`).catch(() => ({})),
      get(`${GAMES}/v2/games/${uid}/media`).catch(() => ({})),
      creatorId ? get(`${USERS}/v1/users/${creatorId}`).catch(() => null) : Promise.resolve(null),
      get(`${GAMES}/v1/games/multiget-place-details?placeIds=${universe.rootPlaceId}`).catch(() => null),
      get(`${THUMBS}/v1/games/icons?universeIds=${uid}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`).catch(() => null),
      creatorAnalytics(uid, universe.created),
    ])
    const vote = votes.data?.[0] || votes[0] || {}, fav = favs.favoritesCount ?? favs.count ?? 0
    const placeData = place?.data?.[0] || place?.[0] || null
    const icon = thumb?.data?.[0]?.imageUrl || media?.data?.[0]?.imageUrl || media?.data?.[0]?.url || null
    const totalVotes = (vote.upVotes || 0) + (vote.downVotes || 0), ageDays = Math.max(1, Math.floor((Date.now() - new Date(universe.created).getTime()) / 86400000))
    return NextResponse.json({ universe, votes: vote, favorites: fav, media, icon, creator, place: placeData, fetchedAt: new Date().toISOString(), derived: { ageDays, ageYears: ageDays / 365.25, likeRate: totalVotes ? vote.upVotes / totalVotes * 100 : null, visitsPerFavorite: fav ? universe.visits / fav : null, playersPerServer: universe.playing && universe.maxPlayers ? universe.playing / universe.maxPlayers : null, concurrencyShare: universe.visits ? universe.playing / universe.visits * 100 : null, favoriteRate: universe.visits && fav ? fav / universe.visits * 100 : null, estimatedServers: universe.playing && universe.maxPlayers ? Math.ceil(universe.playing / universe.maxPlayers) : null, serverFill: universe.playing && universe.maxPlayers ? universe.playing / universe.maxPlayers * 100 : null, visitsPerDay: universe.visits ? universe.visits / ageDays : null, favoritesPerDay: fav ? fav / ageDays : null, visitsPerPlaying: universe.playing ? universe.visits / universe.playing : null }, history: { privateAnalytics, note: 'Roblox public endpoints expose cumulative totals and current concurrency, not a retroactive public CCU time series for every experience. Historical charts require archived snapshots or Creator Analytics access.' } })
  } catch (e: any) { return NextResponse.json({ error: e.message || 'Erreur API Roblox' }, { status: 502 }) }
}