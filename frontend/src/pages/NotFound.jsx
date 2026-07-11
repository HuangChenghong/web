import React from 'react';
import { Button, Result } from 'antd';
import {useNavigate} from 'react-router-dom';
const NotFound = () => {
  const navigate = useNavigate();
  return (
    <Result
      status="404"
      title="404"
      subTitle="糟糕，页面走丢了~~"
      extra={<Button type="primary" onClick={() => { navigate('/')}}>返回首页</Button>}
    />
  )
}

export default NotFound;