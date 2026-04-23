'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function HistoryPage() {
  const [ranking, setRanking] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState('')

  const fetchHistory = async (month: string) => {
    // month は "2026-04" のような形式を想定
    const start = new Date(month + '-01T09:00:00Z')
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)

    const { data: results } = await supabase
      .from('results')
      .select('*')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())

    const { data: playersData } = await supabase.from('players').select('*')
    const scoreMap: any = {}

    results?.forEach(r => {
      [r.player1, r.player2, r.player3, r.player4].forEach((id, i) => {
        if (!id) return
        if (!scoreMap[id]) {
          const player = playersData?.find(pl => pl.id === id)
          scoreMap[id] = { name: player?.name || '不明', total: 0 }
        }
        scoreMap[id].total += [r.score1, r.score2, r.score3, r.score4][i]
      })
    })

    setRanking(Object.values(scoreMap).sort((a: any, b: any) => b.total - a.total))
  }

  return (
    <div style={{ padding: 20, backgroundColor: '#000', minHeight: '100vh', color: '#fff' }}>
      <nav style={{ marginBottom: 20 }}>
        <Link href="/" style={{ color: '#fff' }}>← トップページに戻る</Link>
      </nav>

<div style={{ backgroundColor: '#fff', color: '#000', padding: '20px', borderRadius: '8px' }}>
        <h1 style={{ marginTop: 0 }}>過去のランキング</h1>
        
        {/* 黒枠で囲った月選択エリア */}
        <div style={{ 
          border: '1px solid #000', 
          borderRadius: '8px', 
          padding: '10px', 
          marginBottom: '20px' 
        }}>
          <input 
            type="month" 
            onChange={(e) => { setSelectedMonth(e.target.value); fetchHistory(e.target.value) }}
            style={{ 
              padding: '10px', 
              fontSize: '1rem', 
              width: '100%', 
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

{ranking.length > 0 ? (
          ranking.map((p, i) => (
            <div 
              key={i} 
              style={{ 
                padding: '10px', 
                borderBottom: '1px solid #eee', 
                // ここを条件式に変更しました
                fontWeight: (i + 1) <= 3 ? 'bold' : 'normal' 
              }}
            >
              {i + 1}位: {p.name} ({p.total.toFixed(1)})
            </div>
          ))
        ) : (
          <p>データが見つかりません</p>
        )}
      </div>
    </div>
  )

}