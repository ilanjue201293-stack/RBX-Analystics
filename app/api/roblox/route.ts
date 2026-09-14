import { NextRequest, NextResponse } from 'next/server'

const GAMES='https://games.roblox.com'; const THUMBS='https://thumbnails.roblox.com'; const USERS='https://users.roblox.com'; const ECONOMY='https://economy.roblox.com'
async function get(url:string){const r=await fetch(url,{next:{revalidate:30},headers:{accept:'application/json'}}); if(!r.ok) throw new Error(`${r.status} ${url}`); return r.json()}
function universeId(input:string){const m=input.match(/games\/(\d+)/i); if(m)return m[1]; if(/^\d+$/.test(input.trim()))return input.trim(); return null}
export async function GET(req:NextRequest){
 const q=req.nextUrl.searchParams.get('q')?.trim(); const id=universeId(q||'');
 try{
  let universe:any;
  if(id){ universe=(await get(`${GAMES}/v1/games?universeIds=${id}`)).data?.[0] }
  else if(q){ const s=await get(`${GAMES}/v1/games/list?keyword=${encodeURIComponent(q)}&model.keyword=${encodeURIComponent(q)}&maxRows=20`); universe=s.games?.[0]||s.data?.[0] }
  if(!universe?.id) return NextResponse.json({error:'Jeu introuvable'}, {status:404})
  const uid=String(universe.id); const creatorId=universe.creator?.id
  const [votes,favs,media,creator,places] = await Promise.allSettled([
   get(`${GAMES}/v1/games/votes?universeIds=${uid}`),
   get(`${GAMES}/v1/games/${uid}/favorites/count`),
   get(`${GAMES}/v2/games/${uid}/media`),
   creatorId?get(`${USERS}/v1/users/${creatorId}`):Promise.resolve(null),
   get(`${GAMES}/v1/games/multiget-place-details?placeIds=${universe.rootPlaceId}`)
  ])
  const vote=votes.status==='fulfilled'?(votes.value.data?.[0]||votes.value[0]):{}
  const fav=favs.status==='fulfilled'?(favs.value.favoritesCount??favs.value.count??0):null
  const med=media.status==='fulfilled'?media.value:null
  const user=creator.status==='fulfilled'?creator.value:null
  const place=places.status==='fulfilled'?(places.value.data?.[0]||places.value[0]):null
  return NextResponse.json({
   universe, votes:vote, favorites:fav, media:med, creator:user, place,
   fetchedAt:new Date().toISOString(),
   derived:{
    likeRate: vote?.upVotes+vote?.downVotes ? vote.upVotes/(vote.upVotes+vote.downVotes)*100 : null,
    visitsPerLike:fav ? universe.visits/fav : null,
    playersPerServer: universe.playing && universe.maxPlayers ? universe.playing/universe.maxPlayers : null,
    visitToPlayer: universe.visits ? universe.playing/universe.visits*100 : null,
    estimatedServers: universe.playing && universe.maxPlayers ? Math.ceil(universe.playing/universe.maxPlayers) : null
   }
  })
 }catch(e:any){return NextResponse.json({error:e.message||'Erreur Roblox API'}, {status:502})}
}