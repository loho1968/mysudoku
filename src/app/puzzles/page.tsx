'use client';

import { Layout, Typography, Card } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

export default function PuzzlesPage() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
        <Card>
          <Title level={3}>题目管理</Title>
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            题目管理开发中...
          </div>
        </Card>
      </Content>
    </Layout>
  );
}
