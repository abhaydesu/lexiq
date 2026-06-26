import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Library } from './pages/Library';
import { Reader } from './pages/Reader';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/library" element={<Library />} />
      <Route path="/read/:id" element={<Reader />} />
    </Routes>
  );
}

export default App;
