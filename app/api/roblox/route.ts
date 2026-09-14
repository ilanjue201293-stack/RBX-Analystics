import { NextRequest, NextResponse } from 'next/server'
const GAMES='https://games.roblox.com'; const USERS='https://users.roblox.com'
async function get(url:string){const r=await fetch(url,{next:{revalidate:30},headers:{accept:'application/json'}});if(!r.ok)throw new Error(`${r.status} Roblox API`);return r.json()}
function urlPlace(input:string){return input.match(/roblox\.com\/games\/(\d+)/i)?.[1]||null}
export async function GET(req:NextRequest){
 const q=req.nextUrl.searchParams.get('q')?.trim(); if(!q)return NextResponse.json({error:'Recherche vide'},{status:400})
 try{
  let universe:any
  const placeId=urlPlace(q)
  if(placeId){const p=await get(`${GAMES}/v1/games/multiget-place-details?placeIds=${placeId}`);const d=p.data?.[0]||p[0];if(d?.universeId)universe=(await get(`${GAMES}/v1/games?universeIds=${d.universeId}`)).data?.[0]}
  else if(/^\d+$/.test(q)){universe=(await get(`${GAMES}/v1/games?universeIds=${q}`)).data?.[0]}
  else {const s=await get(`${GAMES}/v1/games/list?keyword=${encodeURIComponent(q)}&maxRows=20`);universe=s.games?.[0]||s.data?.[0]}
  if(!universe?.id)return NextResponse.json({error:'Jeu introuvable'},{status:404})
  const uid=String(universe.id),creatorId=universe.creator?.id
  const [votes,favs,media,creator,place] = await Promise.allSettled([
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
  const placeData=place.status==='fulfilled'?(place.value.data?.[0]||place.value[0]):null
  const totalVotes=(vote?.upVotes||0)+(vote?.downVotes||0)
  return NextResponse.json({universe,votes:vote,favorites:fav,media:med,creator:user,place:placeData,fetchedAt:new Date().toISOString(),derived:{likeRate:totalVotes?vote.upVotes/totalVotes*100:null,visitsPerFavorite:fav?universe.visits/fav:null,playersPerServer:universe.playing&&universe.maxPlayers?universe.playing/universe.maxPlayers:null,concurrencyShare:universe.visits?universe.playing/universe.visits*100:null,favoriteRate:universe.visits&&fav?fav/universe.visits*100:null,estimatedServers:universe.playing&&universe.maxPlayers?Math.ceil(universe.playing/universe.maxPlayers):null,serverFill:universe.playing&&universe.maxPlayers?universe.playing/universe.maxPlayers*100:null}})
 }catch(e:any){return NextResponse.json({error:e.message||'Erreur Roblox API'},{status:502})}
}