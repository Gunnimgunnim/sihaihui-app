'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [players, setPlayers] = useState<any[]>([])
  const [selected, setSelected] = useState(['','','',''])
  const [scores, setScores] = useState([0,0,0,0])
  const [ranking, setRanking] = useState<any[]>([])
  const [gameCount, setGameCount] = useState(0)

  useEffect(() => {
    fetchPlayers()
    fetchRanking()
  }, [])

  const fetchPlayers = async () => {
    const { data, error } = await supabase.from('players').select('*')

    console.log("players:", data)
    console.log("error:", error)

    setPlayers(data || [])
  }

  const calculateScores = (scores: number[]) => {
    const players = scores.map((score, i) => ({
      index: i,
      score,
    }))

    players.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }
      return a.index - b.index // 頭ハネ
    })

    const uma = [40, 10, -10, -20]
    const result = Array(4).fill(0)

    players.forEach((p, rank) => {
      const base = (p.score - 30000) / 1000
      const value = base + uma[rank]
      result[p.index] = Math.round(value * 10) / 10 // 小数対策
    })

    return result
  }

  const fetchRanking = async () => {
    const now = new Date()
const firstDay = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  1,
  9, 0, 0
)

    const { data: results, error: resultsError } = await supabase
      .from('results')
      .select('*')
      .gte('created_at', firstDay.toISOString())

    if (resultsError) {
      console.log(resultsError)
      return
    }



    const { data: playersData } = await supabase.from('players').select('*')

    const scoreMap: any = {}

    results?.forEach(r => {
      const list = [
        { id: r.player1, score: r.score1 },
        { id: r.player2, score: r.score2 },
        { id: r.player3, score: r.score3 },
        { id: r.player4, score: r.score4 },
      ]

      list.forEach(p => {
        if (!scoreMap[p.id]) {
          const player = playersData?.find(pl => pl.id === p.id)
          scoreMap[p.id] = { name: player?.name, total: 0, games: 0 }
        }

        scoreMap[p.id].total += p.score
        scoreMap[p.id].games += 1
      })
    })

    setRanking(
      Object.values(scoreMap).sort((a:any,b:any)=>b.total-a.total)
    )

    // ←ここが重要（外に出さない）
    setGameCount(results?.length || 0)
  }

const submit = async () => {
  // 合計チェック
  const total = scores.reduce((a, b) => a + b, 0)

  if (total !== 100000) {
    alert(`点数の合計が100000ではありません（現在: ${total}）`)
    return
  }

  const finalScores = calculateScores(scores)

  const { error } = await supabase.from('results').insert({
    player1: selected[0],
    player2: selected[1],
    player3: selected[2],
    player4: selected[3],
    score1: finalScores[0],
    score2: finalScores[1],
    score3: finalScores[2],
    score4: finalScores[3],
  })

  if (error) {
    alert("エラー: " + error.message)
    return
  }

  fetchRanking()
  alert('対局お疲れ様でした')
}
  return (
    <div style={{ padding: 20 }}>
    <h1>四海会成績記録ページ（β版）</h1>
      {['東家','南家','西家','北家'].map((label, i) => (
        <div key={i}>
          <label>{label}</label>

          <select onChange={e => {
            const s = [...selected]
            s[i] = e.target.value
            setSelected(s)
          }}>
            <option>選択</option>
            {players.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <input
            type="number"
            onChange={e => {
              const sc = [...scores]
              sc[i] = Number(e.target.value)
              setScores(sc)
            }}
          />
        </div>
      ))}

      <button onClick={submit}>送信</button>

      <h2>今月の試合数：{gameCount}</h2>

      <h2>今月のランキング</h2>
      {ranking.map((p, i) => (
        <div key={i}>
          {i+1}位 {p.name} : {p.total.toFixed(1)}
        </div>
      ))}
    </div>
  )
}