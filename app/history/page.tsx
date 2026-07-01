'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function HistoryPage() {
  const [ranking, setRanking] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState('')
  const [gameCount, setGameCount] = useState(0) // 💡合計試合数の状態を追加

const fetchHistory = async (month: string) => {
    if (!month) return

    const [yearStr, monthStr] = month.split('-')
    const year = parseInt(yearStr, 10)
    const monthIndex = parseInt(monthStr, 10) - 1 // 0 = 1月, 1 = 2月...

    // 【厳密なUTC期間の生成】
    // 例：month が "2026-05" の場合
    // startISO: 2026年5月1日朝6時（JST） ＝ 2026年4月30日21:00:00（UTC）
    // endISO: 2026年6月1日朝6時（JST） ＝ 2026年5月31日21:00:00（UTC）
    const startISO = new Date(Date.UTC(year, monthIndex, 0, 21, 0, 0, 0)).toISOString()
    const endISO = new Date(Date.UTC(year, monthIndex + 1, 0, 21, 0, 0, 0)).toISOString()

    const { data: results } = await supabase
      .from('results')
      .select('*')
      .gte('created_at', startISO)
      .lt('created_at', endISO)

    const { data: playersData } = await supabase.from('players').select('*')
    const scoreMap: any = {}

    results?.forEach(r => {
      [r.player1, r.player2, r.player3, r.player4].forEach((id, i) => {
        if (!id) return
        if (!scoreMap[id]) {
          const player = playersData?.find(pl => pl.id === id)
          scoreMap[id] = { name: player?.name || '不明', total: 0, games: 0 }
        }
        scoreMap[id].total += [r.score1, r.score2, r.score3, r.score4][i]
        scoreMap[id].games += 1
      })
    })

    setRanking(Object.values(scoreMap).sort((a: any, b: any) => b.total - a.total))
    setGameCount(results?.length || 0) // 💡取得した対局数をセット
  }

  return (
    <div style={{ padding: 20, backgroundColor: '#000', minHeight: '100vh', color: '#fff' }}>
      <nav style={{ marginBottom: 20 }}>
        <Link href="/" style={{ color: '#fff' }}>← トップページに戻る</Link>
      </nav>

      <div style={{ backgroundColor: '#fff', color: '#000', padding: '20px', borderRadius: '8px' }}>
        
        {/* 見出しと合計試合数を横並びに配置 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h1 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.5rem' }}>過去のランキング</h1>
          {selectedMonth && (
            <span style={{ fontWeight: 'bold' }}>（この月の試合数：{gameCount}）</span>
          )}
        </div>
        
        {/* 月選択エリア */}
        <div style={{ borderRadius: '8px', padding: '10px', marginBottom: '20px' }}>
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
          ranking.map((p, i) => {
            const isTooFew = p.games <= 4
            return (
              <div 
                key={i} 
                style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #eee', 
                  color: isTooFew ? '#777777' : '#000',
                  fontWeight: (!isTooFew && (i + 1) <= 3) ? 'bold' : 'normal' 
                }}
              >
                {i + 1}位: {p.name} : {p.total.toFixed(1)} ({p.games})
              </div>
            )
          })
        ) : (
          <p>データが見つかりません</p>
        )}
      </div>
    </div>
  )
}