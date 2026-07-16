'use client';

import { useParams } from 'next/navigation';
import { Layout, Card, Typography, Spin } from 'antd';
import { useEffect, useState } from 'react';

const { Content } = Layout;
const { Title } = Typography;

interface Puzzle {
  id: string;
  puzzle: string;
  difficulty: number;
}

export default function GameWithPuzzlePage() {
  const params = useParams();
  const id = params.id as string;
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/puzzles/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setPuzzle(data.data);
        setLoading(false);
      });
  }, [id]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : puzzle ? (
            <>
              <Title level={3} style={{ textAlign: 'center' }}>
                数独
              </Title>
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                棋盘加载中... (题目: {puzzle.puzzle.substring(0, 9)}...)
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              题目不存在
            </div>
          )}
        </Card>
      </Content>
    </Layout>
  );
}
