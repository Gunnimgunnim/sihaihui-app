'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function EditPage() {
  const [results, setResults] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [editingScores, setEditingScores] = useState<Record<string, number[]>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: playersData } = await supabase.from('players').select('*')
    const { data: resultsData } = await supabase
      .from('results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    setPlayers(playersData || [])
    setResults(resultsData || [])
  }

  const getPlayerName = (id: string) => {
    return players.find((p) => p.id === id)?.name || '不明'
  }

  const handleUpdate = async (r: any) => {
    const newScores = editingScores[r.id] || [r.score1, r.score2, r.score3, r.score4]
    const { error } = await supabase
      .from('results')
      .update({
        score1: newScores[0],
        score2: newScores[1],
        score3: newScores[2],
        score4: newScores[3],
      })
      .eq('id', r.id)

    if (error) alert('エラー: ' + error.message)
    else alert('更新しました')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return
    await supabase.from('results').delete().eq('id', id)
    fetchData()
  }

  return (
    // 背景色を黒に設定
    <div style={{ padding: 20, backgroundColor: '#000', minHeight: '100vh', color: '#fff' }}>
      <nav style={{ marginBottom: 20 }}>
        <Link href="/" style={{ color: '#fff' }}>← トップページに戻る</Link>
      </nav>
      <h1 style={{ color: '#fff' }}>対局履歴の修正</h1>

      {results.map((r) => (
        <div key={r.id} style={{ 
          border: '1px solid #444', 
          borderRadius: '8px', 
          margin: '15px 0', 
          padding: '15px', 
          backgroundColor: '#fff', // 枠内を白に
          color: '#000'            // 文字を黒に
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>{new Date(r.created_at).toLocaleString()}</p>

          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0', borderBottom: '1px solid #eee' }}>
              <span style={{ width: '100px', fontWeight: '500' }}>{getPlayerName(r[`player${i + 1}`])}</span>
              <input
                type="number"
                defaultValue={r[`score${i + 1}`]}
                style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '4px', width: '100px', color: '#000' }}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setEditingScores(prev => {
                    const current = prev[r.id] || [r.score1, r.score2, r.score3, r.score4]
                    current[i] = val
                    return { ...prev, [r.id]: current }
                  })
                }}
              />
            </div>
          ))}

          <div style={{ marginTop: '10px', gap: '10px', display: 'flex' }}>
            <button onClick={() => handleUpdate(r)} style={{ padding: '8px 16px', cursor: 'pointer' }}>更新</button>
            <button onClick={() => handleDelete(r.id)} style={{ padding: '8px 16px', cursor: 'pointer', color: 'red' }}>削除</button>
          </div>
        </div>
      ))}
    </div>
  )
}