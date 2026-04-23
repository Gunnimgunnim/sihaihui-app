'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#808080']

export default function StatsPage() {
  const [players, setPlayers] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    const { data } = await supabase.from('players').select('*')
    setPlayers(data || [])
  }

  const calculateStats = async (playerId: string) => {
    if (!playerId) {
      setStats(null)
      return
    }

    const { data: results } = await supabase.from('results').select('*')
    if (!results) return

    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)

    const playerResults = results.filter(r => 
      [r.player1, r.player2, r.player3, r.player4].includes(playerId)
    )

    const process = (data: any[]) => {
      let totalScore = 0
      let counts = { 1: 0, 2: 0, 3: 0, 4: 0 }
      
      data.forEach(r => {
        const scores = [r.score1, r.score2, r.score3, r.score4]
        const players = [r.player1, r.player2, r.player3, r.player4]
        const idx = players.indexOf(playerId)
        
        totalScore += scores[idx]
        const rank = scores.filter(s => s > scores[idx]).length + 1
        counts[rank as keyof typeof counts]++
      })

      const games = data.length || 1
      const pieData = [
        { name: '1位', value: counts[1] },
        { name: '2位', value: counts[2] },
        { name: '3位', value: counts[3] },
        { name: '4位', value: counts[4] },
      ]

      return { totalScore, counts, games, pieData }
    }

    const all = process(playerResults)
    const monthly = process(playerResults.filter(r => new Date(r.created_at) >= firstDay))

    setStats({ all, monthly })
  }

  const RankingPie = ({ data }: { data: any[] }) => (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )

  const StatsBlock = ({ title, data }: { title: string, data: any }) => (
    <div style={{ flex: 1, minWidth: '300px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h2 style={{ fontSize: '1.2rem', borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '15px' }}>{title}</h2>
      <p style={{ margin: '5px 0' }}>対局数: <span style={{ fontWeight: 'bold' }}>{data.games}</span></p>
      <p style={{ margin: '5px 0' }}>合計スコア: <span style={{ fontWeight: 'bold' }}>{data.totalScore.toFixed(1)}</span></p>
      <div style={{ display: 'flex', gap: '10px', fontSize: '0.9rem', marginTop: '10px' }}>
        {[1, 2, 3, 4].map(rank => (
          <span key={rank}>{rank}位: {((data.counts[rank] / data.games) * 100).toFixed(0)}%</span>
        ))}
      </div>
      <RankingPie data={data.pieData} />
    </div>
  )

  return (
    <div style={{ padding: 20, backgroundColor: '#000', minHeight: '100vh', color: '#fff' }}>
      <nav style={{ marginBottom: 20 }}>
        <Link href="/" style={{ color: '#fff' }}>← トップページに戻る</Link>
      </nav>
      
      <div style={{ backgroundColor: '#fff', color: '#000', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h1 style={{ marginTop: 0 }}>個人成績閲覧</h1>
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }}>
          <select 
            onChange={(e) => { setSelectedId(e.target.value); calculateStats(e.target.value) }} 
            style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            <option value="">プレイヤーを選択してください</option>
            {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {stats && (
        <div style={{ backgroundColor: '#fff', color: '#000', padding: '20px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            <StatsBlock title="通算成績" data={stats.all} />
            <StatsBlock title="今月の成績" data={stats.monthly} />
          </div>
        </div>
      )}
    </div>
  )
}