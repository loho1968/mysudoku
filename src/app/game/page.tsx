'use client';

import { Layout, Typography, Card } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

export default function GamePage() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <Card>
          <Title level={3} style={{ textAlign: 'center' }}>
            mySudoku — 数独
          </Title>
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            棋盘开发中...
          </div>
        </Card>
      </Content>
    </Layout>
  );
}
