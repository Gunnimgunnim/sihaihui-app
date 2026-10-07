'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function HistoryPage() {
  const [mode, setMode] = useState<'month' | 'year'>('month') // 'month' または 'year'
  const [ranking, setRanking] = useState<any[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [gameCount, setGameCount] = useState(0)

  // 1. 月別データの取得（JST 該当月1日06:00 〜 翌月1日06:00）
  const fetchMonthlyHistory = async (monthStrValue: string) => {
    if (!monthStrValue) return

    const [yearStr, monthStr] = monthStrValue.split('-')
    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10) // 1-12

    // JST 該当月1日 06:00 = UTC 前月最終日 21:00 (＝ 該当月1日 00:00 UTC - 3時間)
    // JST 翌月1日 06:00 = UTC 当月最終日 21:00
    const startISO = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0) - 3 * 60 * 60 * 1000).toISOString()
    const endISO = new Date(Date.UTC(year, month, 1, 0, 0, 0) - 3 * 60 * 60 * 1000).toISOString()

    await fetchAndProcessResults(startISO, endISO)
  }

  // 2. 年度別データの取得（JST 該当年度4月1日06:00 〜 翌年4月1日06:00）
  const fetchYearlyHistory = async (yearStrValue: string) => {
    if (!yearStrValue) return

    const year = parseInt(yearStrValue, 10)

    // JST 該当年度4月1日 06:00 = UTC 3月31日 21:00 (＝ 4月1日 00:00 UTC - 3時間)
    // JST 翌年4月1日 06:00 = UTC 翌年3月31日 21:00
    const startISO = new Date(Date.UTC(year, 3, 1, 0, 0, 0) - 3 * 60 * 60 * 1000).toISOString()
    const endISO = new Date(Date.UTC(year + 1, 3, 1, 0, 0, 0) - 3 * 60 * 60 * 1000).toISOString()

    await fetchAndProcessResults(startISO, endISO)
  }

  // Supabaseからの取得＆集計共通処理
  const fetchAndProcessResults = async (startISO: string, endISO: string) => {
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
    setGameCount(results?.length || 0)
  }

  // モード切替時の処理
  const handleModeChange = (newMode: 'month' | 'year') => {
    setMode(newMode)
    setSelectedPeriod('')
    setRanking([])
    setGameCount(0)
  }

  // 年度選択の選択肢を作成（例: 2023年度〜2030年度）
  const currentYear = new Date().getFullYear()
  const yearOptions = []
  for (let y = currentYear; y >= 2023; y--) {
    yearOptions.push(y)
  }

  return (
    <div style={{ padding: 20, backgroundColor: '#000', minHeight: '100vh', color: '#fff' }}>
      <nav style={{ marginBottom: 20 }}>
        <Link href="/" style={{ color: '#fff' }}>← トップページに戻る</Link>
      </nav>

      <div style={{ backgroundColor: '#fff', color: '#000', padding: '20px', borderRadius: '8px' }}>
        
        {/* 見出しと合計試合数を横並びに配置 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h1 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.5rem' }}>過去のランキング</h1>
          {selectedPeriod && (
            <span style={{ fontWeight: 'bold' }}>（この期間の試合数：{gameCount}）</span>
          )}
        </div>

        {/* タブ切替（月別 / 年度別） */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button
            onClick={() => handleModeChange('month')}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '0.95rem',
              fontWeight: 'bold',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: mode === 'month' ? '#000' : '#f0f0f0',
              color: mode === 'month' ? '#fff' : '#000',
              cursor: 'pointer'
            }}
          >
            月別ランキング
          </button>
          <button
            onClick={() => handleModeChange('year')}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '0.95rem',
              fontWeight: 'bold',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: mode === 'year' ? '#000' : '#f0f0f0',
              color: mode === 'year' ? '#fff' : '#000',
              cursor: 'pointer'
            }}
          >
            年度別ランキング
          </button>
        </div>

        {/* 期間選択エリア */}
        <div style={{ padding: '10px 0', marginBottom: '20px' }}>
          {mode === 'month' ? (
            <input 
              type="month" 
              value={selectedPeriod}
              onChange={(e) => { setSelectedPeriod(e.target.value); fetchMonthlyHistory(e.target.value) }}
              style={{ 
                padding: '10px', 
                fontSize: '1rem', 
                width: '100%', 
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          ) : (
            <select
              value={selectedPeriod}
              onChange={(e) => { setSelectedPeriod(e.target.value); fetchYearlyHistory(e.target.value) }}
              style={{
                padding: '10px',
                fontSize: '1rem',
                width: '100%',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">年度を選択してください</option>
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}年度（{y}年4月〜{y + 1}年3月）</option>
              ))}
            </select>
          )}
        </div>

        {/* ランキング表示部分 */}
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
          <p style={{ color: '#666' }}>
            {selectedPeriod ? 'データが見つかりません' : '対象の期間を選択してください'}
          </p>
        )}
      </div>
    </div>
  )
}