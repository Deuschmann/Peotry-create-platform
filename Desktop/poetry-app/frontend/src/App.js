import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink } from 'react-router-dom';
import TreeList from './components/TreeList';
import PrivateStudio from './components/PrivateStudio';
import './App.css';

const getNickname = () => localStorage.getItem('poetry-nickname');
const setNickname = (name) => localStorage.setItem('poetry-nickname', name);

function App() {
  const [nickname, setCurrentNickname] = useState(getNickname());

  useEffect(() => {
    if (!nickname) {
      const name = prompt("欢迎来到诗歌宇宙！请输入您的创作者昵称：");
      if (name && name.trim()) {
        setNickname(name.trim());
        setCurrentNickname(name.trim());
      } else {
        setNickname('游客');
        setCurrentNickname('游客');
      }
    }
  }, [nickname]);

  const handleChangeNickname = () => {
    const newName = prompt("请输入新的昵称：", nickname);
    if (newName && newName.trim()) {
      setNickname(newName.trim());
      setCurrentNickname(newName.trim());
    }
  };

  return (
    <Router>
      <nav className="main-nav">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'active-link' : '')}>群体广场</NavLink>
        <NavLink to="/studio" className={({ isActive }) => (isActive ? 'active-link' : '')}>个人工作室</NavLink>
        <div className="user-info">
          <span>{nickname}</span>
          <button onClick={handleChangeNickname} className="change-name-btn">改名</button>
        </div>
      </nav>
      <div className="main-content">
        <Routes>
          <Route path="/" element={<TreeList nickname={nickname} />} />
          <Route path="/studio" element={<PrivateStudio nickname={nickname} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;