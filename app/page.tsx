'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [players, setPlayers] = useState<any[]>([])
  const [selected, setSelected] = useState(['', '', '', ''])
  const [scores, setScores] = useState([0, 0, 0, 0])
  const [ranking, setRanking] = useState<any[]>([])
  const [gameCount, setGameCount] = useState(0)
  const [recentResult, setRecentResult] = useState<any>(null) // 追加

  useEffect(() => {
    fetchPlayers()
    fetchRanking()
  }, [])

  const fetchPlayers = async () => {
    const { data } = await supabase.from('players').select('*')
    setPlayers(data || [])
  }

  const getPlayerName = (id: string) => {
    return players.find((p) => p.id === id)?.name || '不明'
  }

  const calculateScores = (scores: number[]) => {
    const players = scores.map((score, i) => ({ index: i, score }))
    players.sort((a, b) => b.score !== a.score ? b.score - a.score : a.index - b.index)
    const uma = [40, 10, -10, -20]
    const result = Array(4).fill(0)
    players.forEach((p, rank) => {
      result[p.index] = Math.round(((p.score - 300) / 10 + uma[rank]) * 10) / 10
    })
    return result
  }

  const fetchRanking = async () => {
    const now = new Date();
    const jstDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const firstDay = new Date(jstDate.getFullYear(), jstDate.getMonth(), 1);
    const firstDayISO = new Date(firstDay.getTime() - (firstDay.getTimezoneOffset() * 60000)).toISOString();

    const { data: results } = await supabase.from('results').select('*').gte('created_at', firstDayISO)
    const { data: playersData } = await supabase.from('players').select('*')

    // 最新の結果を取得
    const { data: latest } = await supabase.from('results').select('*').order('created_at', { ascending: false }).limit(1)
    if (latest && latest.length > 0) setRecentResult(latest[0])

    const scoreMap: any = {}
    results?.forEach(r => {
      [ { id: r.player1, score: r.score1 }, { id: r.player2, score: r.score2 }, { id: r.player3, score: r.score3 }, { id: r.player4, score: r.score4 } ].forEach(p => {
        if (!scoreMap[p.id]) {
          const player = playersData?.find(pl => pl.id === p.id)
          scoreMap[p.id] = { name: player?.name, total: 0, games: 0 }
        }
        scoreMap[p.id].total += p.score
        scoreMap[p.id].games += 1
      })
    })

    setRanking(Object.values(scoreMap).sort((a: any, b: any) => b.total - a.total))
    setGameCount(results?.length || 0)
  }

  const submit = async () => {
    if (scores.reduce((a, b) => a + b, 0) !== 1000) { alert('合計が1000ではありません'); return }
    const finalScores = calculateScores(scores)
    await supabase.from('results').insert({
      player1: selected[0], player2: selected[1], player3: selected[2], player4: selected[3],
      score1: finalScores[0], score2: finalScores[1], score3: finalScores[2], score4: finalScores[3]
    })
    fetchRanking()
    alert('対局お疲れ様でした')
  }

  return (
    <div style={{ padding: 20, backgroundColor: '#000', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ color: '#fff', fontSize: '18pt', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }}>四海会成績記録サイト</h1>

      {/* 入力フォーム */}
      <div style={{ backgroundColor: '#fff', color: '#000', padding: '20px', borderRadius: '8px' }}>
        {['東家', '南家', '西家', '北家'].map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #ddd' }}>
            <label style={{ width: '60px', fontWeight: 'bold' }}>{label}</label>
            <select style={{ flex: 1, padding: '5px' }} onChange={(e) => { const s = [...selected]; s[i] = e.target.value; setSelected(s) }}>
              <option>プレイヤー選択</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="number" style={{ width: '80px', padding: '5px', border: '1px solid #ccc' }} onChange={(e) => { const sc = [...scores]; sc[i] = Number(e.target.value); setScores(sc) }} />
          </div>
        ))}
        <button onClick={submit} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#fff', border: '2px solid #000', cursor: 'pointer', fontWeight: 'bold' }}>送信</button>
      </div>

      {/* 直近の対局結果 */}
      <div style={{ marginTop: '20px', backgroundColor: '#FFF', color: '#000', padding: '15px', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 10px 0' , fontWeight: 'bold'}}>直近の対局結果</h3>
        {recentResult ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '0.9rem' }}>
            {[1, 2, 3, 4].map(i => <div key={i}>{getPlayerName(recentResult[`player${i}`])}: {recentResult[`score${i}`]}</div>)}
          </div>
        ) : <p>データなし</p>}
      </div>

      {/* ランキング */}
      <div style={{ marginTop: '30px', backgroundColor: '#fff', color: '#000', padding: '20px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h1 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.5rem' }}>今月のランキング</h1>
          <span style={{ fontWeight: 'bold' }}>（今月の試合数：{gameCount}）</span>
        </div>
        {ranking.map((p, i) => {
          const isTooFew = p.games <= 2;
          return (
            <div key={i} style={{ padding: '5px 0', borderBottom: '1px solid #eee', color: isTooFew ? '#999' : '#000', fontWeight: (!isTooFew && (i + 1) <= 3) ? 'bold' : 'normal' }}>
              {i + 1}位 {p.name} : {p.total.toFixed(1)} ({p.games})
            </div>
          )
        })}
      </div>

      {/* ボタン類 */}
      <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Link href="/edit" style={{ backgroundColor: '#fff', color: '#000', padding: '15px', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold' }}>対局履歴の編集・削除</Link>
        <Link href="/stats" style={{ backgroundColor: '#fff', color: '#000', padding: '15px', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold' }}>個人成績閲覧</Link>
        <Link href="/history" style={{ backgroundColor: '#fff', color: '#000', padding: '15px', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold' }}>過去のランキング</Link>
      </div>
    </div>
  )
}