import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PrivateStudio = ({ nickname }) => {
  const [poems, setPoems] = useState([]);
  const [currentPoem, setCurrentPoem] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (nickname) {
      axios.get(`http://localhost:5001/api/private/poems?author=${nickname}`)
        .then(res => setPoems(res.data))
        .catch(err => console.error("Failed to fetch private poems:", err));
    }
  }, [nickname]);

  const selectPoem = (poem) => {
    setCurrentPoem(poem);
    setTitle(poem.title);
    setContent(poem.content);
  };

  const handleNewPoem = () => {
    setCurrentPoem(null);
    setTitle('无题');
    setContent('');
  };

  const handleSavePoem = async () => {
    if (!nickname) return alert('需要昵称才能保存');
    const poemData = { title, content, authorNickname: nickname };
    
    try {
      if (currentPoem) {
        const res = await axios.put(`http://localhost:5001/api/private/poems/${currentPoem._id}`, poemData);
        setPoems(poems.map(p => (p._id === currentPoem._id ? res.data : p)));
      } else {
        const res = await axios.post('http://localhost:5001/api/private/poems', poemData);
        setPoems([res.data, ...poems]);
        setCurrentPoem(res.data);
      }
      alert('保存成功！');
    } catch (error) {
      alert('保存失败');
      console.error(error);
    }
  };

  const handleDeletePoem = async () => {
    if (currentPoem && window.confirm('确定要删除这首诗吗？')) {
      try {
        await axios.delete(`http://localhost:5001/api/private/poems/${currentPoem._id}`);
        setPoems(poems.filter(p => p._id !== currentPoem._id));
        handleNewPoem();
      } catch (error) {
        alert('删除失败');
        console.error(error);
      }
    }
  };

  const handlePublish = async () => {
    if (!content.trim()) return alert('内容不能为空');
    if (window.confirm('发布后，这首诗将成为公共作品的起点，确定要发布吗？')) {
      try {
        await axios.post('http://localhost:5001/api/private/publish', { content, authorNickname: nickname });
        alert('发布成功！即将跳转到广场...');
        navigate('/');
      } catch (error) {
        alert('发布失败');
        console.error(error);
      }
    }
  };

  return (
    <div className="studio-container">
      <div className="poem-list">
        <button onClick={handleNewPoem} className="new-poem-btn">+ 新建诗歌</button>
        <ul>
          {poems.map(poem => (
            <li 
              key={poem._id} 
              onClick={() => selectPoem(poem)}
              className={currentPoem?._id === poem._id ? 'selected' : ''}
            >
              {poem.title}
              <small>{new Date(poem.updatedAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      </div>
      <div className="editor-area">
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          className="editor-title"
        />
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="在这里写下你的诗句..."
          className="editor-content"
        />
        <div className="editor-actions">
          <button onClick={handleSavePoem}>保存草稿</button>
          {currentPoem && <button onClick={handleDeletePoem} className="delete-btn">删除</button>}
          <button onClick={handlePublish} className="publish-btn">发布到广场</button>
        </div>
      </div>
    </div>
  );
};

export default PrivateStudio;